#!/usr/bin/env node
// Lists and digests Claude Code and Codex session logs for a retro.
// Read-only: it never writes.
//
// Log record types it reads (undocumented formats; unknown types are skipped):
// - Claude Code (~/.claude/projects/<slug>/<id>.jsonl, one JSON per line):
//   type "user" (message.content string or array of text/tool_result blocks;
//   isMeta marks injected text; toolUseResult.answers holds AskUserQuestion
//   answers), type "assistant" (message.content tool_use blocks),
//   type "ai-title" (aiTitle), any line with customTitle.
// - Codex (~/.codex/sessions/YYYY/MM/DD/rollout-*.jsonl): type "session_meta"
//   (payload.id, payload.cwd), type "response_item" with payload.type
//   "message" (role user, content[].text), "function_call" /
//   "custom_tool_call" (name), and "*_output" (output; first line
//   "Script failed" or "aborted before dispatch" marks an error).
import { existsSync, realpathSync } from 'node:fs';
import { readdir, readFile, stat } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';

const usage = `Usage:
  node scripts/session-digest.mjs list <project-dir> [<since YYYY-MM-DD>]
  node scripts/session-digest.mjs digest <log.jsonl> [<max-chars>]
`;

const HOME = os.homedir();
const CLAUDE_PROJECTS = path.join(HOME, '.claude', 'projects');
const CODEX_DIRS = [path.join(HOME, '.codex', 'sessions'), path.join(HOME, '.codex', 'archived_sessions')];
// 300 chars per item keeps a 3 MB log's digest near 20 KB while keeping most
// user quotes whole.
const DEFAULT_MAX_CHARS = 300;
// UI commands, not workflow skills; listing them hides the real skills.
const UI_COMMANDS = new Set(['clear', 'model', 'context', 'rename', 'statusline', 'compact', 'resume', 'exit']);
// Injected text that is not the user's own words.
const INJECTED = [
  /^<(system-reminder|command-|local-command|task-notification|environment_context|skill>|INSTRUCTIONS)/,
  /^Base directory for this skill/,
  /^# AGENTS\.md instructions/,
  /^Caveat: The messages below/,
];
const REJECTED = "The user doesn't want to proceed with this tool use";
const CODEX_ERROR = /^(Script failed|aborted before dispatch)/;

function fail(message) {
  process.stderr.write(`${message}\n`);
  process.exit(2);
}

function tilde(p) {
  return p.startsWith(`${HOME}/`) ? `~${p.slice(HOME.length)}` : p;
}

function cut(text, max) {
  const flat = String(text).replace(/\s+/g, ' ').trim();
  return flat.length > max ? `${flat.slice(0, max)}…` : flat;
}

function isInjected(text) {
  const trimmed = text.trimStart();
  return trimmed === '' || INJECTED.some((re) => re.test(trimmed));
}

async function readLines(file) {
  const text = await readFile(file, 'utf8');
  const records = [];
  let skipped = 0;
  for (const line of text.split('\n')) {
    if (!line.trim()) continue;
    try {
      records.push(JSON.parse(line));
    } catch {
      // Logs can be truncated mid-write; count and move on.
      skipped += 1;
    }
  }
  return { records, skipped };
}

function textOf(content) {
  if (typeof content === 'string') return content;
  if (!Array.isArray(content)) return '';
  return content
    .filter((b) => b?.type === 'text' || b?.type === 'input_text')
    .map((b) => b.text)
    .join('\n');
}

function claudeSkills(records) {
  const skills = new Set();
  for (const r of records) {
    const content = r.message?.content;
    const text = typeof content === 'string' ? content : textOf(content);
    for (const m of text.matchAll(/<command-name>\/([a-z0-9:-]+)<\/command-name>/g)) skills.add(m[1]);
    if (Array.isArray(content)) {
      for (const b of content) {
        if (b?.type === 'tool_use' && b.name === 'Skill' && b.input?.skill) skills.add(b.input.skill);
      }
    }
  }
  return [...skills].filter((s) => !UI_COMMANDS.has(s));
}

function codexSkills(records) {
  const skills = new Set();
  for (const r of records) {
    if (r.type !== 'response_item' || r.payload?.role !== 'user') continue;
    const text = textOf(r.payload.content);
    for (const m of text.matchAll(/<skill>\s*<name>([a-z0-9-]+)<\/name>/g)) skills.add(m[1]);
    const dollar = text.match(/^\$([a-z0-9-]+)/);
    if (dollar) skills.add(dollar[1]);
  }
  return [...skills];
}

function firstUserText(records, agent) {
  for (const r of records) {
    let text = '';
    if (agent === 'claude-code' && r.type === 'user' && !r.isMeta) text = textOf(r.message?.content);
    if (agent === 'codex' && r.type === 'response_item' && r.payload?.role === 'user') text = textOf(r.payload.content);
    if (text && !isInjected(text)) return text;
  }
  return '';
}

function stamp(date) {
  return date.toISOString().slice(0, 16).replace('T', ' ');
}

function size(bytes) {
  return bytes >= 1048576 ? `${(bytes / 1048576).toFixed(1)}M` : `${Math.ceil(bytes / 1024)}K`;
}

async function summarize(file, agent) {
  const info = await stat(file);
  const { records } = await readLines(file);
  let title = '';
  if (agent === 'claude-code') {
    for (const r of records) {
      if (r.customTitle) title = r.customTitle;
      else if (r.type === 'ai-title' && !title) title = r.aiTitle;
    }
  }
  if (!title) title = firstUserText(records, agent);
  const skills = agent === 'claude-code' ? claudeSkills(records) : codexSkills(records);
  const id = agent === 'codex'
    ? (records.find((r) => r.type === 'session_meta')?.payload?.id ?? path.basename(file, '.jsonl'))
    : path.basename(file, '.jsonl');
  return {
    mtime: info.mtime,
    line: `${agent} ${id.replace(/^agent-/, '').slice(0, 8)} ${stamp(info.mtime)} ${size(info.size)} ${cut(title, 80)} [${skills.join(', ')}] ${tilde(file)}`,
  };
}

async function walk(dir, predicate) {
  if (!existsSync(dir)) return [];
  const out = [];
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...(await walk(full, predicate)));
    else if (predicate(entry.name)) out.push(full);
  }
  return out;
}

async function codexCwd(file) {
  const text = await readFile(file, 'utf8');
  for (const line of text.split('\n', 20)) {
    try {
      const r = JSON.parse(line);
      if (r.type === 'session_meta') return r.payload?.cwd ?? null;
    } catch {
      // A malformed header line: keep looking.
    }
  }
  return null;
}

async function list(projectDir, since) {
  const absolute = path.resolve(projectDir);
  if (!existsSync(absolute)) throw new Error(`Project dir does not exist: ${projectDir}`);
  if (since !== undefined && !/^\d{4}-\d{2}-\d{2}$/.test(since)) throw new Error(`Since must be YYYY-MM-DD: ${since}`);
  const project = realpathSync(absolute);
  const sinceDate = since ? new Date(`${since}T00:00:00`) : null;
  const keep = async (file) => !sinceDate || (await stat(file)).mtime >= sinceDate;
  const rows = [];

  const slugDir = path.join(CLAUDE_PROJECTS, project.replace(/[/.]/g, '-'));
  if (existsSync(slugDir)) {
    for (const name of (await readdir(slugDir)).filter((n) => n.endsWith('.jsonl'))) {
      const file = path.join(slugDir, name);
      if (!(await keep(file))) continue;
      const row = await summarize(file, 'claude-code');
      const subDir = path.join(slugDir, path.basename(name, '.jsonl'), 'subagents');
      const subs = [];
      for (const sub of await walk(subDir, (n) => n.endsWith('.jsonl'))) {
        subs.push(`    ${(await summarize(sub, 'claude-code')).line}`);
      }
      rows.push({ mtime: row.mtime, text: [row.line, ...subs].join('\n') });
    }
  } else {
    process.stdout.write(`No Claude sessions in ${tilde(slugDir)}\n`);
  }

  for (const dir of CODEX_DIRS) {
    for (const file of await walk(dir, (n) => n.endsWith('.jsonl'))) {
      if (!(await keep(file))) continue;
      const cwd = await codexCwd(file);
      if (!cwd || (cwd !== project && !cwd.startsWith(`${project}/`))) continue;
      const row = await summarize(file, 'codex');
      rows.push({ mtime: row.mtime, text: row.line });
    }
  }

  rows.sort((a, b) => b.mtime - a.mtime);
  process.stdout.write(rows.length ? `${rows.map((r) => r.text).join('\n')}\n` : 'No sessions found\n');
}

async function digest(file, maxArg) {
  if (!existsSync(file)) throw new Error(`Log does not exist: ${file}`);
  if (maxArg !== undefined && !/^[1-9]\d*$/.test(maxArg)) throw new Error(`Max chars must be a positive integer: ${maxArg}`);
  const max = maxArg ? Number(maxArg) : DEFAULT_MAX_CHARS;
  const { records, skipped } = await readLines(file);
  const codex = records.some((r) => r.type === 'session_meta' || r.type === 'response_item');
  const counts = new Map();
  const bump = (name) => counts.set(name, (counts.get(name) ?? 0) + 1);
  const toolNames = new Map();
  const out = [];
  const time = (r) => (r.timestamp ? r.timestamp.slice(11, 16) : '--:--');

  for (const r of records) {
    if (codex) {
      if (r.type !== 'response_item') continue;
      const p = r.payload ?? {};
      if (p.type === 'message' && p.role === 'user') {
        const text = textOf(p.content);
        if (!isInjected(text)) out.push(`USER ${time(r)} ${cut(text, max)}`);
      } else if (p.type === 'function_call' || p.type === 'custom_tool_call') {
        bump(p.name);
        toolNames.set(p.call_id, p.name);
        if (p.name === 'spawn_agent') out.push(`AGENT ${time(r)} ${cut(p.arguments ?? '', max)}`);
      } else if (p.type === 'function_call_output' || p.type === 'custom_tool_call_output') {
        const text = typeof p.output === 'string' ? p.output : textOf(p.output);
        if (CODEX_ERROR.test(text)) out.push(`ERROR ${toolNames.get(p.call_id) ?? 'tool'} ${time(r)} ${cut(text, max)}`);
      }
      continue;
    }

    const content = r.message?.content;
    if (r.type === 'user' && !r.isMeta) {
      if (typeof content === 'string') {
        if (!isInjected(content)) out.push(`USER ${time(r)} ${cut(content, max)}`);
        continue;
      }
      for (const b of content ?? []) {
        if (b?.type === 'text' && !isInjected(b.text)) out.push(`USER ${time(r)} ${cut(b.text, max)}`);
        if (b?.type !== 'tool_result') continue;
        const name = toolNames.get(b.tool_use_id) ?? 'tool';
        const text = typeof b.content === 'string' ? b.content : textOf(b.content);
        if (text.includes(REJECTED)) out.push(`REJECTED ${name} ${time(r)} ${cut(text, max)}`);
        else if (b.is_error) out.push(`ERROR ${name} ${time(r)} ${cut(text, max)}`);
      }
      const answers = r.toolUseResult?.answers;
      if (answers && typeof answers === 'object') {
        for (const [q, a] of Object.entries(answers)) out.push(`ASK ${time(r)} ${cut(q, max)} => ${cut(a, max)}`);
      }
    } else if (r.type === 'assistant' && Array.isArray(content)) {
      for (const b of content) {
        if (b?.type !== 'tool_use') continue;
        bump(b.name);
        toolNames.set(b.id, b.name);
        if (b.name === 'Agent' || b.name === 'Task') {
          out.push(`AGENT ${time(r)} ${cut(b.input?.description ?? b.input?.prompt ?? '', max)}`);
        }
      }
    }
  }

  const tally = [...counts].sort((a, b) => b[1] - a[1]).map(([n, c]) => `${n} ${c}`).join(', ');
  out.push(
    '---',
    `${codex ? 'codex' : 'claude-code'} ${tilde(path.resolve(file))}`,
    `tools: ${tally || 'none'}`,
    `lines: ${records.length + skipped}, unparseable skipped: ${skipped}`,
  );
  process.stdout.write(`${out.join('\n')}\n`);
}

async function main() {
  const [command, ...args] = process.argv.slice(2);
  switch (command) {
    case 'list':
      if (args.length < 1 || args.length > 2) return fail(usage);
      return list(...args);
    case 'digest':
      if (args.length < 1 || args.length > 2) return fail(usage);
      return digest(...args);
    case 'help':
    case '--help':
    case '-h':
      process.stdout.write(usage);
      return;
    default:
      return fail(usage);
  }
}

main().catch((error) => fail(error.message));
