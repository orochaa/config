#!/usr/bin/env node
// Writes and queries retro records: one JSON file per retro, the plan, the
// implementation tracker, and the history later retros read.
// Schema and lifecycle: ../references/records.md.
// One retro session owns its record, so writes need no locking; each write
// is atomic (temp file + rename).
import { randomUUID } from 'node:crypto';
import { existsSync, realpathSync } from 'node:fs';
import { mkdir, readdir, readFile, rename, unlink, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';

const usage = `Usage:
  node scripts/retro-record.mjs new <slug> <project-dir> <scope> [<YYYY-MM-DD>]
  node scripts/retro-record.mjs add-session <record> <session-id> <log-path> [<kind>]
  node scripts/retro-record.mjs add-candidate <record> <candidate.json>
  node scripts/retro-record.mjs decide <record> <candidate-id> <approved|modified|rejected> <user-note> [<change.md>]
  node scripts/retro-record.mjs implement <record> <candidate-id> <done|failed> <verification> [<repo>@<sha>]
  node scripts/retro-record.mjs set-notes <record> <notes.json>
  node scripts/retro-record.mjs show <record> [--open]
  node scripts/retro-record.mjs history [<project-dir>]
  node scripts/retro-record.mjs search <regex>

Records live in $RETRO_RECORDS_DIR (default ~/.agents/retros).
`;

const HOME = os.homedir();
// Outside every repo, so records (which quote the user and name private
// repos) stay on this machine.
const RECORDS_DIR = process.env.RETRO_RECORDS_DIR ?? path.join(HOME, '.agents', 'retros');
// Two records are the fewest that show a problem came back.
const RECURRENCE_MIN = 2;
// Lets a later script migrate old records.
const SCHEMA_VERSION = 1;

const RECORD_ID = /^\d{4}-\d{2}-\d{2}-[a-z0-9]+(-[a-z0-9]+)*$/;
const SLUG = /^[a-z0-9]+(-[a-z0-9]+)*$/;
const CANDIDATE_ID = /^[LR]\d{2,}$/;
const COMMIT = /^.+@[0-9a-f]{7,40}$/;
const CATEGORIES = [
  'navigation',
  'automated-checks',
  'coding-standards',
  'global-agents-md',
  'tool-economy',
  'no-ops',
  'information-access',
];
const SEVERITIES = ['high', 'med', 'low'];
const SCOPES = ['local', 'remote'];
const VERDICTS = ['approved', 'modified', 'rejected'];
const DESCRIPTIVE = [
  'title',
  'category',
  'severity',
  'scope',
  'targets',
  'tags',
  'problem',
  'evidence',
  'recommendation',
  'relatedTo',
  'change',
  'verify',
];

function fail(message) {
  process.stderr.write(`${message}\n`);
  process.exit(2);
}

function tilde(p) {
  return p === HOME || p.startsWith(`${HOME}/`) ? `~${p.slice(HOME.length)}` : p;
}

function untilde(p) {
  return p === '~' || p.startsWith('~/') ? path.join(HOME, p.slice(1)) : p;
}

function existingPath(p, label) {
  const resolved = path.resolve(untilde(p));
  if (!existsSync(resolved)) throw new Error(`${label} does not exist: ${p}`);
  return tilde(realpathSync(resolved));
}

function now() {
  return new Date().toISOString();
}

function localDate() {
  const d = new Date();
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function recordPath(id) {
  if (!RECORD_ID.test(id ?? '')) throw new Error(`Record id must look like YYYY-MM-DD-slug: ${id}`);
  return path.join(RECORDS_DIR, `${id}.json`);
}

async function readJson(file, label) {
  let text;
  try {
    text = await readFile(file, 'utf8');
  } catch (error) {
    throw new Error(`Cannot read ${label} ${file}: ${error.code ?? error.message}`);
  }
  try {
    return JSON.parse(text);
  } catch (error) {
    throw new Error(`Invalid JSON in ${label} ${file}: ${error.message}`);
  }
}

async function loadRecord(id) {
  const file = recordPath(id);
  if (!existsSync(file)) throw new Error(`No record ${id} in ${RECORDS_DIR}`);
  return readJson(file, 'record');
}

async function saveRecord(record) {
  record.updatedAt = now();
  const file = recordPath(record.id);
  const temporaryPath = `${file}.${process.pid}.${randomUUID()}.tmp`;
  try {
    await mkdir(path.dirname(file), { recursive: true });
    await writeFile(temporaryPath, `${JSON.stringify(record, null, 2)}\n`, { flag: 'wx' });
    await rename(temporaryPath, file);
  } catch (error) {
    await unlink(temporaryPath).catch(() => {});
    throw error;
  }
}

async function loadAll() {
  if (!existsSync(RECORDS_DIR)) return [];
  const names = (await readdir(RECORDS_DIR)).filter((n) => n.endsWith('.json')).sort();
  const records = [];
  for (const name of names) {
    // History is only useful when complete: an unreadable record fails.
    records.push(await readJson(path.join(RECORDS_DIR, name), 'record'));
  }
  return records;
}

function findCandidate(record, candidateId) {
  const candidate = record.candidates.find((c) => c.id === candidateId);
  if (!candidate) throw new Error(`No candidate ${candidateId} in ${record.id}`);
  return candidate;
}

function requireString(obj, key) {
  if (typeof obj[key] !== 'string' || obj[key].trim() === '') {
    throw new Error(`Candidate field "${key}" must be a non-empty string`);
  }
}

function requireEnum(obj, key, values) {
  if (!values.includes(obj[key])) {
    throw new Error(`Candidate field "${key}" must be one of ${values.join(', ')}: ${obj[key]}`);
  }
}

async function validateCandidate(record, input) {
  for (const key of ['title', 'problem', 'recommendation']) requireString(input, key);
  requireEnum(input, 'category', CATEGORIES);
  requireEnum(input, 'severity', SEVERITIES);
  requireEnum(input, 'scope', SCOPES);
  if (!Array.isArray(input.targets) || input.targets.length === 0) {
    throw new Error('Candidate field "targets" must be a non-empty array');
  }
  input.targets = input.targets.map((t) => {
    if (typeof t !== 'string' || t === '') throw new Error('Each target must be a non-empty string');
    return tilde(t);
  });
  input.tags = input.tags ?? [];
  if (!Array.isArray(input.tags) || input.tags.some((t) => !SLUG.test(t))) {
    throw new Error('Candidate field "tags" must be an array of kebab-case strings');
  }
  if (!Array.isArray(input.evidence) || input.evidence.length === 0) {
    throw new Error('Candidate field "evidence" must be a non-empty array of {session, quote}');
  }
  for (const item of input.evidence) {
    if (typeof item?.quote !== 'string' || item.quote === '') {
      throw new Error('Each evidence item needs a non-empty "quote"');
    }
    if (typeof item.session !== 'string' || item.session.length < 8) {
      throw new Error(`Evidence session must be a session id or 8+ char prefix: ${item.session}`);
    }
    const match = record.sessions.find((s) => s.id.startsWith(item.session));
    if (!match) throw new Error(`Evidence session ${item.session} is not recorded; run add-session first`);
  }
  input.relatedTo = input.relatedTo ?? [];
  if (!Array.isArray(input.relatedTo)) throw new Error('Candidate field "relatedTo" must be an array');
  if (input.relatedTo.length > 0) {
    const all = await loadAll();
    for (const ref of input.relatedTo) {
      const [recordId, candidateId] = String(ref).split('/');
      const other = recordId === record.id ? record : all.find((r) => r.id === recordId);
      if (!other?.candidates.some((c) => c.id === candidateId)) {
        throw new Error(`relatedTo entry does not exist: ${ref}`);
      }
    }
  }
  for (const key of ['change', 'verify']) {
    if (input[key] !== undefined && typeof input[key] !== 'string') {
      throw new Error(`Candidate field "${key}" must be a string`);
    }
  }
  if (input.id !== undefined && !CANDIDATE_ID.test(input.id)) {
    throw new Error(`Candidate id must look like L01 or R01: ${input.id}`);
  }
}

function nextId(record, scope) {
  const prefix = scope === 'local' ? 'L' : 'R';
  const numbers = record.candidates
    .filter((c) => c.id.startsWith(prefix))
    .map((c) => Number(c.id.slice(1)));
  return `${prefix}${String(Math.max(0, ...numbers) + 1).padStart(2, '0')}`;
}

async function cmdNew(slug, projectDir, scope, date) {
  if (!SLUG.test(slug)) throw new Error(`Slug must be kebab-case: ${slug}`);
  // The date defaults to today; pass one only to import an earlier retro.
  if (date !== undefined && !/^\d{4}-\d{2}-\d{2}$/.test(date)) throw new Error(`Date must be YYYY-MM-DD: ${date}`);
  if (!scope.trim()) throw new Error('Scope must be non-empty');
  const project = existingPath(projectDir, 'Project dir');
  const id = `${date ?? localDate()}-${slug}`;
  const file = recordPath(id);
  if (existsSync(file)) {
    process.stdout.write(`Exists ${file}\n`);
    return;
  }
  const at = now();
  await saveRecord({
    version: SCHEMA_VERSION,
    id,
    createdAt: at,
    updatedAt: at,
    project,
    scope,
    constraints: [],
    facts: [],
    sessions: [],
    candidates: [],
  });
  process.stdout.write(`Created ${id} at ${file}\n`);
}

async function cmdAddSession(id, sessionId, logPath, kind) {
  const record = await loadRecord(id);
  if (!/^[A-Za-z0-9-]{8,}$/.test(sessionId)) throw new Error(`Session id looks wrong: ${sessionId}`);
  const log = existingPath(logPath, 'Log path');
  const agent = log.startsWith('~/.claude/projects/')
    ? 'claude-code'
    : log.startsWith('~/.codex/')
      ? 'codex'
      : 'other';
  const entry = { id: sessionId, agent, log, kind: kind ?? null };
  const index = record.sessions.findIndex((s) => s.id === sessionId);
  if (index >= 0) record.sessions[index] = entry;
  else record.sessions.push(entry);
  await saveRecord(record);
  process.stdout.write(`Session ${sessionId.slice(0, 8)} ${index >= 0 ? 'updated' : 'added'} in ${id}\n`);
}

async function cmdAddCandidate(id, candidateFile) {
  const record = await loadRecord(id);
  const input = await readJson(path.resolve(candidateFile), 'candidate');
  await validateCandidate(record, input);
  const candidateId = input.id ?? nextId(record, input.scope);
  const existing = record.candidates.find((c) => c.id === candidateId);
  const descriptive = Object.fromEntries(DESCRIPTIVE.filter((k) => k in input).map((k) => [k, input[k]]));
  if (existing) {
    Object.assign(existing, descriptive);
  } else {
    record.candidates.push({
      id: candidateId,
      ...descriptive,
      verdict: 'pending',
      userNote: null,
      decidedAt: null,
      status: null,
      implementedAt: null,
      verification: null,
      commits: [],
    });
  }
  await saveRecord(record);
  process.stdout.write(`${existing ? 'Updated' : 'Added'} ${candidateId} in ${id}\n`);
}

async function cmdDecide(id, candidateId, verdict, note, changeFile) {
  if (!VERDICTS.includes(verdict)) throw new Error(`Verdict must be one of ${VERDICTS.join(', ')}`);
  if (!note.trim()) throw new Error('User note must be non-empty; quote the user');
  const record = await loadRecord(id);
  const candidate = findCandidate(record, candidateId);
  if (changeFile) candidate.change = await readFile(path.resolve(changeFile), 'utf8');
  if (verdict !== 'rejected' && !candidate.change?.trim()) {
    throw new Error(`${candidateId} is ${verdict} but has no exact change; pass <change.md>`);
  }
  candidate.verdict = verdict;
  candidate.userNote = note;
  candidate.decidedAt = now();
  candidate.status = verdict === 'rejected' ? 'skipped' : 'todo';
  await saveRecord(record);
  process.stdout.write(`Decided ${candidateId} ${verdict} in ${id}\n`);
}

async function cmdImplement(id, candidateId, status, verification, commit) {
  if (!['done', 'failed'].includes(status)) throw new Error('Status must be done or failed');
  if (!verification.trim()) throw new Error('Verification must be non-empty');
  if (commit !== undefined && !COMMIT.test(commit)) throw new Error(`Commit must look like <repo>@<sha>: ${commit}`);
  const record = await loadRecord(id);
  const candidate = findCandidate(record, candidateId);
  if (!['approved', 'modified'].includes(candidate.verdict)) {
    throw new Error(`${candidateId} is ${candidate.verdict}; only approved or modified items are implemented`);
  }
  candidate.status = status;
  candidate.verification = verification;
  candidate.implementedAt = now();
  if (commit) {
    const [repo, sha] = [commit.slice(0, commit.lastIndexOf('@')), commit.slice(commit.lastIndexOf('@') + 1)];
    const entry = `${tilde(path.resolve(untilde(repo)))}@${sha}`;
    if (!candidate.commits.includes(entry)) candidate.commits.push(entry);
  }
  await saveRecord(record);
  process.stdout.write(`Marked ${candidateId} ${status} in ${id}\n`);
}

async function cmdSetNotes(id, notesFile) {
  const record = await loadRecord(id);
  const notes = await readJson(path.resolve(notesFile), 'notes');
  for (const key of ['constraints', 'facts']) {
    if (key in notes) {
      if (!Array.isArray(notes[key]) || notes[key].some((v) => typeof v !== 'string')) {
        throw new Error(`"${key}" must be an array of strings`);
      }
      record[key] = notes[key];
    }
  }
  await saveRecord(record);
  process.stdout.write(`Notes set in ${id}: ${record.constraints.length} constraints, ${record.facts.length} facts\n`);
}

function renderCandidate(c) {
  const lines = [
    `### ${c.id}: ${c.title}`,
    '',
    `- Verdict: ${c.verdict}${c.status ? ` · Status: ${c.status}` : ''}`,
    `- Severity: ${c.severity} · Scope: ${c.scope} · Category: ${c.category}`,
    `- Targets: ${c.targets.map((t) => `\`${t}\``).join(', ')}`,
  ];
  if (c.tags.length) lines.push(`- Tags: ${c.tags.join(', ')}`);
  if (c.relatedTo.length) lines.push(`- Related: ${c.relatedTo.join(', ')}`);
  if (c.userNote) lines.push(`- User: "${c.userNote}"`);
  lines.push('', `**Problem:** ${c.problem}`, '', '**Evidence:**');
  for (const e of c.evidence) lines.push(`- ${e.session.slice(0, 8)}: "${e.quote}"`);
  lines.push('', `**Recommendation:** ${c.recommendation}`);
  if (c.change) lines.push('', '**Change:**', '', c.change.trimEnd());
  if (c.verify) lines.push('', `**Verify:** ${c.verify}`);
  if (c.verification) lines.push('', `**Verification:** ${c.verification}`);
  if (c.commits.length) lines.push('', `**Commits:** ${c.commits.join(', ')}`);
  lines.push('');
  return lines.join('\n');
}

async function cmdShow(id, flag) {
  if (flag !== undefined && flag !== '--open') return fail(usage);
  const record = await loadRecord(id);
  const out = [`# Retro ${record.id}`, '', `- Project: \`${record.project}\``, `- Scope: ${record.scope}`, ''];
  if (record.constraints.length) {
    out.push('## Constraints', '', ...record.constraints.map((c) => `- ${c}`), '');
  }
  if (record.facts.length) out.push('## Facts', '', ...record.facts.map((f) => `- ${f}`), '');
  out.push('## Sessions', '', '| Session | Agent | Kind | Log |', '| --- | --- | --- | --- |');
  for (const s of record.sessions) {
    out.push(`| ${s.id.slice(0, 8)} | ${s.agent} | ${s.kind ?? ''} | \`${s.log}\` |`);
  }
  out.push('');
  const groups = flag === '--open'
    ? [['Open', (c) => ['approved', 'modified'].includes(c.verdict) && ['todo', 'failed'].includes(c.status)]]
    : [
        ['Pending', (c) => c.verdict === 'pending'],
        ['Approved', (c) => ['approved', 'modified'].includes(c.verdict)],
        ['Rejected', (c) => c.verdict === 'rejected'],
      ];
  for (const [heading, keep] of groups) {
    const items = record.candidates.filter(keep);
    out.push(`## ${heading} (${items.length})`, '');
    for (const c of items) out.push(renderCandidate(c));
  }
  process.stdout.write(`${out.join('\n').trimEnd()}\n`);
}

function count(candidates, predicate) {
  return candidates.filter(predicate).length;
}

async function cmdHistory(projectDir) {
  let records = await loadAll();
  if (projectDir) {
    const project = existingPath(projectDir, 'Project dir');
    records = records.filter((r) => r.project === project);
  }
  if (records.length === 0) {
    process.stdout.write(`No retro records in ${RECORDS_DIR}\n`);
    return;
  }
  const out = [`Records (${records.length}):`];
  for (const r of records) {
    const cs = r.candidates;
    out.push(
      `  ${r.id}  ${r.project}  ${r.sessions.length} sessions  ` +
        `${count(cs, (c) => c.verdict === 'approved')} approved, ` +
        `${count(cs, (c) => c.verdict === 'modified')} modified, ` +
        `${count(cs, (c) => c.verdict === 'rejected')} rejected, ` +
        `${count(cs, (c) => c.verdict === 'pending')} pending`,
    );
  }
  const recurring = (keyOf) => {
    const byKey = new Map();
    for (const r of records) {
      for (const c of r.candidates) {
        for (const key of keyOf(c)) {
          if (!byKey.has(key)) byKey.set(key, []);
          byKey.get(key).push({ record: r.id, c });
        }
      }
    }
    return [...byKey].filter(([, items]) => new Set(items.map((i) => i.record)).size >= RECURRENCE_MIN);
  };
  const ref = ({ record, c }) => `${record}/${c.id} ${c.verdict}/${c.status ?? '-'}`;
  for (const [heading, keyOf] of [
    ['Recurring targets', (c) => c.targets],
    ['Recurring tags', (c) => c.tags],
  ]) {
    const items = recurring(keyOf);
    out.push(`${heading} (in >=${RECURRENCE_MIN} records):${items.length ? '' : ' none'}`);
    for (const [key, list] of items) out.push(`  ${key}: ${list.map(ref).join('; ')}`);
  }
  const all = records.flatMap((r) => r.candidates.map((c) => ({ record: r.id, c })));
  const rejected = all.filter(({ c }) => c.verdict === 'rejected').reverse();
  out.push(`Rejected (${rejected.length}, newest first):`);
  for (const { record, c } of rejected) out.push(`  ${record}/${c.id} ${c.title} — "${c.userNote}"`);
  const open = all.filter(({ c }) => ['approved', 'modified'].includes(c.verdict) && c.status !== 'done');
  out.push(`Open (${open.length}):`);
  for (const { record, c } of open) out.push(`  ${record}/${c.id} [${c.status}] ${c.title}`);
  process.stdout.write(`${out.join('\n')}\n`);
}

async function cmdSearch(pattern) {
  let regex;
  try {
    regex = new RegExp(pattern, 'i');
  } catch (error) {
    throw new Error(`Invalid regex: ${error.message}`);
  }
  const hits = [];
  for (const r of await loadAll()) {
    for (const c of r.candidates) {
      const haystack = [
        c.title,
        c.problem,
        c.recommendation,
        c.userNote ?? '',
        ...c.tags,
        ...c.targets,
        ...c.evidence.map((e) => e.quote),
      ].join('\n');
      if (regex.test(haystack)) hits.push(`${r.id}/${c.id} [${c.verdict}/${c.status ?? '-'}] ${c.title}`);
    }
  }
  process.stdout.write(hits.length ? `${hits.join('\n')}\n` : `No matches for /${pattern}/i\n`);
}

async function main() {
  const [command, ...args] = process.argv.slice(2);
  switch (command) {
    case 'new':
      if (args.length < 3 || args.length > 4) return fail(usage);
      return cmdNew(...args);
    case 'add-session':
      if (args.length < 3 || args.length > 4) return fail(usage);
      return cmdAddSession(...args);
    case 'add-candidate':
      if (args.length !== 2) return fail(usage);
      return cmdAddCandidate(...args);
    case 'decide':
      if (args.length < 4 || args.length > 5) return fail(usage);
      return cmdDecide(...args);
    case 'implement':
      if (args.length < 4 || args.length > 5) return fail(usage);
      return cmdImplement(...args);
    case 'set-notes':
      if (args.length !== 2) return fail(usage);
      return cmdSetNotes(...args);
    case 'show':
      if (args.length < 1 || args.length > 2) return fail(usage);
      return cmdShow(...args);
    case 'history':
      if (args.length > 1) return fail(usage);
      return cmdHistory(args[0]);
    case 'search':
      if (args.length !== 1) return fail(usage);
      return cmdSearch(args[0]);
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
