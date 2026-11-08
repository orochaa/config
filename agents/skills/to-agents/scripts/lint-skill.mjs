#!/usr/bin/env node
// Lint skill folders against the mechanical rules in SKILL-MECHANICS.md.
// Read-only: it writes nothing, so reruns are safe.
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import path from 'node:path';

const usage = `Usage:
  node scripts/lint-skill.mjs check <skill-dir> [<skill-dir> ...]

Exit codes: 0 no errors (warnings allowed), 1 errors found, 2 usage or I/O error.
`;

// Claude Code and the Agent Skills spec cap `name` at 64 characters.
const NAME_MAX = 64;
// Agent Skills spec: lower-case kebab-case, equal to the folder name.
const NAME_PATTERN = /^[a-z0-9]+(-[a-z0-9]+)*$/;
// Anthropic reserves these words in skill names.
const NAME_RESERVED = ['anthropic', 'claude'];
// Agent Skills spec caps `description` at 1024 characters.
const DESCRIPTION_MAX = 1024;
// Claude Code truncates `description` + `when_to_use` in the skill listing here.
const LISTING_MAX = 1536;
// Agent Skills spec and Anthropic best practices: body under 500 lines.
const BODY_LINES_MAX = 500;
// Body under ~5k tokens; compaction keeps only the first 5k of an invoked skill.
const BODY_TOKENS_MAX = 5000;
// Rough chars-per-token ratio for English prose, good enough for a warning.
const CHARS_PER_TOKEN = 4;
// Anthropic best practices: reference files over 100 lines get a TOC.
const TOC_THRESHOLD_LINES = 100;
// The TOC must appear near the top to be useful on a partial read.
const TOC_SEARCH_LINES = 20;
// to-agents review pass, item 7: prose lines of 80 characters or fewer.
const LINE_MAX = 80;
// Platform guidance: CRITICAL / MUST make recent models over-apply; allow a few.
const EMPHASIS_MAX = 2;
// Codex reads only these top-level keys from agents/openai.yaml.
const OPENAI_KEYS = new Set(['interface', 'policy', 'dependencies']);
// Folders that never hold skill content.
const SKIP_DIRS = new Set(['.git', 'node_modules']);

function fail(message) {
  process.stderr.write(`${message}\n`);
  process.exit(2);
}

// ---------- minimal YAML subset ----------

function indentOf(line) {
  return line.length - line.trimStart().length;
}

function stripComment(value) {
  const index = value.search(/\s#/);
  return index === -1 ? value : value.slice(0, index);
}

// Parse a scalar starting at lines[i] (value text already split off).
// Returns { value, next } where next is the first unconsumed line index.
function parseScalar(raw, lines, i, parentIndent, file) {
  const text = raw.trim();
  if (/^[>|][+-]?$/.test(text)) {
    const folded = text[0] === '>';
    const body = [];
    let j = i + 1;
    while (j < lines.length && (lines[j].trim() === '' || indentOf(lines[j]) > parentIndent)) {
      body.push(lines[j]);
      j += 1;
    }
    while (body.length && body.at(-1).trim() === '') body.pop();
    const minIndent = Math.min(...body.filter((l) => l.trim()).map(indentOf));
    const stripped = body.map((l) => l.slice(minIndent));
    const value = folded
      ? stripped.reduce((acc, l) => (l === '' ? `${acc}\n` : acc && !acc.endsWith('\n') ? `${acc} ${l}` : acc + l), '')
      : stripped.join('\n');
    return { value, next: j };
  }
  if (text.startsWith('"') || text.startsWith("'")) {
    const quote = text[0];
    let joined = text;
    let j = i + 1;
    const closed = (s) => s.length > 1 && s.endsWith(quote) && (quote === "'" || !s.endsWith(`\\${quote}`));
    while (!closed(joined) && j < lines.length) {
      joined += ` ${lines[j].trim()}`;
      j += 1;
    }
    if (!closed(joined)) throw new Error(`${file}:${i + 1}: unterminated ${quote} string`);
    const inner = joined.slice(1, -1);
    const value = quote === "'" ? inner.replace(/''/g, "'") : inner.replace(/\\"/g, '"').replace(/\\n/g, '\n').replace(/\\\\/g, '\\');
    return { value, next: j };
  }
  const parts = [stripComment(text)];
  let j = i + 1;
  while (j < lines.length && lines[j].trim() !== '' && indentOf(lines[j]) > parentIndent) {
    parts.push(stripComment(lines[j].trim()));
    j += 1;
  }
  return { value: parts.filter(Boolean).join(' '), next: j };
}

// Parse a mapping whose keys sit at exactly `indent` spaces.
// Each entry is { value, line } with 1-based line numbers relative to offset.
function parseMapping(lines, start, indent, offset, file) {
  const map = {};
  let i = start;
  while (i < lines.length) {
    const line = lines[i];
    if (line.trim() === '' || line.trim().startsWith('#')) {
      i += 1;
      continue;
    }
    const lineIndent = indentOf(line);
    if (lineIndent < indent) break;
    if (lineIndent > indent) throw new Error(`${file}:${i + 1 + offset}: unexpected indentation`);
    const match = /^([A-Za-z0-9_.-]+):(?:\s+(.*))?$/.exec(line.trim());
    if (!match) throw new Error(`${file}:${i + 1 + offset}: expected "key: value"`);
    const [, key, rest = ''] = match;
    const lineNo = i + 1 + offset;
    const next = lines[i + 1];
    const childIsMapping =
      rest.trim() === '' && next !== undefined && indentOf(next) > indent && /^[A-Za-z0-9_.-]+:(\s|$)/.test(next.trim());
    const childIsSequence = rest.trim() === '' && next !== undefined && indentOf(next) > indent && next.trim().startsWith('- ');
    if (childIsMapping) {
      const child = parseMapping(lines, i + 1, indentOf(next), offset, file);
      map[key] = { value: child.map, line: lineNo };
      i = child.next;
    } else if (childIsSequence) {
      const items = [];
      let j = i + 1;
      while (j < lines.length && (lines[j].trim() === '' || indentOf(lines[j]) > indent)) {
        if (lines[j].trim().startsWith('- ')) items.push(lines[j].trim().slice(2));
        j += 1;
      }
      map[key] = { value: items, line: lineNo };
      i = j;
    } else {
      const scalar = parseScalar(rest, lines, i, indent, file);
      map[key] = { value: scalar.value, line: lineNo };
      i = scalar.next;
    }
  }
  return { map, next: i };
}

function readFrontmatter(file, text) {
  const lines = text.split('\n');
  if (lines[0] !== '---') throw new Error(`${file}:1: missing frontmatter (first line must be ---)`);
  const end = lines.indexOf('---', 1);
  if (end === -1) throw new Error(`${file}:1: unterminated frontmatter`);
  const { map } = parseMapping(lines.slice(1, end), 0, 0, 1, file);
  return { map, bodyStart: end + 1, lines };
}

// ---------- Markdown helpers ----------

function walkMarkdown(dir) {
  const out = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (SKIP_DIRS.has(entry.name)) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...walkMarkdown(full));
    else if (entry.name.endsWith('.md')) out.push(full);
  }
  return out.sort();
}

// Yield [lineNo, line] for prose lines: outside frontmatter and fenced code.
function* proseLines(text, isSkillMd) {
  const lines = text.split('\n');
  let i = 0;
  if (isSkillMd && lines[0] === '---') {
    const end = lines.indexOf('---', 1);
    i = end === -1 ? lines.length : end + 1;
  }
  let fence = null;
  for (; i < lines.length; i += 1) {
    const line = lines[i];
    const fenceMatch = /^\s*(`{3,}|~{3,})/.exec(line);
    if (fenceMatch) {
      if (!fence) fence = fenceMatch[1];
      else if (line.trim().startsWith(fence)) fence = null;
      continue;
    }
    if (!fence) yield [i + 1, line];
  }
}

function linkTargets(line) {
  const targets = [];
  const pattern = /\[[^\]]*\]\(\s*<?([^)\s>]+)>?(?:\s+"[^"]*")?\s*\)/g;
  for (const match of line.matchAll(pattern)) targets.push(match[1]);
  return targets;
}

function isExternal(target) {
  return /^[a-z][a-z0-9+.-]*:/i.test(target) || target.startsWith('#') || target.startsWith('/') || target.startsWith('~');
}

// ---------- rules ----------

function lintSkill(dirArg) {
  const findings = [];
  const add = (level, file, line, rule, message) => findings.push({ level, file, line, rule, message });

  const dir = path.resolve(dirArg);
  if (!existsSync(dir) || !statSync(dir).isDirectory()) fail(`Not a directory: ${dirArg}`);
  const skillFile = path.join(dir, 'SKILL.md');
  if (!existsSync(skillFile)) fail(`No SKILL.md in: ${dirArg}`);
  const rel = (file) => path.relative(process.cwd(), file) || file;

  let skillText;
  try {
    skillText = readFileSync(skillFile, 'utf8');
  } catch (error) {
    fail(`Cannot read ${skillFile}: ${error.message}`);
  }

  let front;
  try {
    front = readFrontmatter(rel(skillFile), skillText);
  } catch (error) {
    add('error', rel(skillFile), 1, 'frontmatter', error.message);
    return findings;
  }
  const fm = front.map;
  const fmValue = (key) => (fm[key] && typeof fm[key].value === 'string' ? fm[key].value : undefined);
  const fmLine = (key) => fm[key]?.line ?? 1;

  // name
  const name = fmValue('name');
  const folder = path.basename(dir);
  if (name === undefined) add('error', rel(skillFile), 1, 'name', 'missing `name`');
  else {
    if (name.length < 1 || name.length > NAME_MAX) add('error', rel(skillFile), fmLine('name'), 'name', `length ${name.length} outside 1-${NAME_MAX}`);
    if (!NAME_PATTERN.test(name)) add('error', rel(skillFile), fmLine('name'), 'name', `"${name}" is not lower-case kebab-case`);
    if (name !== folder) add('error', rel(skillFile), fmLine('name'), 'name', `"${name}" differs from folder "${folder}"`);
    for (const word of NAME_RESERVED) {
      if (name.includes(word)) add('error', rel(skillFile), fmLine('name'), 'name', `contains reserved word "${word}"`);
    }
  }

  // description, use-when, listing
  const description = fmValue('description');
  if (description === undefined || description.trim() === '') add('error', rel(skillFile), 1, 'description', 'missing `description`');
  else {
    if (description.length > DESCRIPTION_MAX) add('error', rel(skillFile), fmLine('description'), 'description', `length ${description.length} over ${DESCRIPTION_MAX}`);
    if (/<\/?[A-Za-z][^>]*>/.test(description)) add('error', rel(skillFile), fmLine('description'), 'description', 'contains an XML tag');
    if (!/\bUse when\b/i.test(description)) add('error', rel(skillFile), fmLine('description'), 'use-when', 'no "Use when…" clause');
    const listing = description.length + (fmValue('when_to_use')?.length ?? 0);
    if (listing > LISTING_MAX) add('error', rel(skillFile), fmLine('description'), 'listing', `description + when_to_use is ${listing} chars, over ${LISTING_MAX}`);
  }

  // body-size
  const body = front.lines.slice(front.bodyStart);
  if (body.length >= BODY_LINES_MAX) add('error', rel(skillFile), front.bodyStart + 1, 'body-size', `body is ${body.length} lines, limit under ${BODY_LINES_MAX}`);
  const tokens = Math.round(body.join('\n').length / CHARS_PER_TOKEN);
  if (tokens >= BODY_TOKENS_MAX) add('warn', rel(skillFile), front.bodyStart + 1, 'body-size', `body is ~${tokens} tokens, aim under ${BODY_TOKENS_MAX}`);

  // Markdown-wide rules
  const mdFiles = walkMarkdown(dir);
  const linkedFromSkill = new Set();
  let emphasis = 0;
  let emphasisFirst = null;
  for (const file of mdFiles) {
    let text;
    try {
      text = readFileSync(file, 'utf8');
    } catch (error) {
      fail(`Cannot read ${file}: ${error.message}`);
    }
    const isSkillMd = file === skillFile;
    for (const [lineNo, line] of proseLines(text, isSkillMd)) {
      for (const target of linkTargets(line.replace(/`[^`]*`/g, ''))) {
        if (isExternal(target)) continue;
        const clean = decodeURIComponent(target.split('#')[0]);
        if (!clean) continue;
        const resolved = path.resolve(path.dirname(file), clean);
        if (!existsSync(resolved)) add('error', rel(file), lineNo, 'links', `broken link: ${target}`);
        else if (isSkillMd) linkedFromSkill.add(resolved);
      }
      const trimmed = line.trim();
      const onlyLink = /^(?:[-*]\s+)?(?:<?https?:\/\/\S+>?|\[[^\]]*\]\([^)]*\))$/.test(trimmed);
      if (!trimmed.startsWith('|') && !onlyLink && [...line].length > LINE_MAX) {
        add('warn', rel(file), lineNo, 'line-length', `${[...line].length} chars, over ${LINE_MAX}`);
      }
      const hits = line.match(/\b(MUST|CRITICAL)\b/g);
      if (hits) {
        emphasis += hits.length;
        emphasisFirst ??= { file, lineNo };
      }
    }
    if (!isSkillMd) {
      const lines = text.split('\n');
      if (lines.length > TOC_THRESHOLD_LINES) {
        const hasToc = lines.slice(0, TOC_SEARCH_LINES).some((l) => /^#+\s.*contents/i.test(l));
        if (!hasToc) add('warn', rel(file), 1, 'toc', `${lines.length} lines and no "Contents" heading in the first ${TOC_SEARCH_LINES}`);
      }
    }
  }
  for (const file of mdFiles) {
    if (file !== skillFile && !linkedFromSkill.has(file)) add('warn', rel(file), 1, 'one-level', 'not linked from SKILL.md');
  }
  if (emphasis > EMPHASIS_MAX) add('warn', rel(emphasisFirst.file), emphasisFirst.lineNo, 'emphasis', `${emphasis} uses of MUST/CRITICAL, over ${EMPHASIS_MAX}`);

  // openai-keys, invocation-parity
  const openaiFile = path.join(dir, 'agents', 'openai.yaml');
  let implicitInvocation = true;
  let implicitLine = 1;
  if (existsSync(openaiFile)) {
    let yaml;
    try {
      yaml = parseMapping(readFileSync(openaiFile, 'utf8').split('\n'), 0, 0, 0, rel(openaiFile)).map;
    } catch (error) {
      add('error', rel(openaiFile), 1, 'openai-keys', error.message);
      yaml = {};
    }
    for (const [key, entry] of Object.entries(yaml)) {
      if (!OPENAI_KEYS.has(key)) add('error', rel(openaiFile), entry.line, 'openai-keys', `unknown top-level key "${key}"`);
    }
    const color = yaml.interface?.value?.brand_color;
    if (color && !/^#[0-9a-fA-F]{6}$/.test(String(color.value))) add('error', rel(openaiFile), color.line, 'openai-keys', `brand_color "${color.value}" is not hex`);
    const allow = yaml.policy?.value?.allow_implicit_invocation;
    if (allow) {
      if (allow.value !== 'true' && allow.value !== 'false') add('error', rel(openaiFile), allow.line, 'openai-keys', `allow_implicit_invocation "${allow.value}" is not a boolean`);
      implicitInvocation = allow.value !== 'false';
      implicitLine = allow.line;
    }
  }
  const disabled = fmValue('disable-model-invocation') === 'true';
  if (disabled && implicitInvocation) {
    add('error', rel(skillFile), fmLine('disable-model-invocation'), 'invocation-parity', 'disable-model-invocation: true needs policy.allow_implicit_invocation: false in agents/openai.yaml');
  } else if (!disabled && !implicitInvocation) {
    add('error', rel(openaiFile), implicitLine, 'invocation-parity', 'allow_implicit_invocation: false needs disable-model-invocation: true in SKILL.md');
  }

  return findings;
}

function check(dirs) {
  let errors = 0;
  let warnings = 0;
  for (const dir of dirs) {
    for (const f of lintSkill(dir)) {
      if (f.level === 'error') errors += 1;
      else warnings += 1;
      process.stdout.write(`${f.file}:${f.line}: ${f.level} ${f.rule} ${f.message}\n`);
    }
  }
  process.stdout.write(`checked ${dirs.length} skills: ${errors} errors, ${warnings} warnings\n`);
  process.exitCode = errors > 0 ? 1 : 0;
}

function main() {
  const [command, ...args] = process.argv.slice(2);
  switch (command) {
    case 'check':
      if (args.length < 1) return fail(usage);
      return check(args);
    case 'help':
    case '--help':
    case '-h':
      process.stdout.write(usage);
      return;
    default:
      return fail(usage);
  }
}

try {
  main();
} catch (error) {
  fail(error.message);
}
