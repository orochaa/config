#!/usr/bin/env node
import { spawnSync } from 'node:child_process';
import { randomUUID } from 'node:crypto';
import { mkdir, readFile, rename, unlink, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

// Absolute path, so usage and hints work from the PR worktree.
const self = fileURLToPath(import.meta.url);
const usage = `Usage:
  node ${self} sync <pr-number> <archive.json>
  node ${self} read-pending <archive.json>
  node ${self} read-comment <archive.json> <comment-id>
  node ${self} read-context <archive.json>
  node ${self} defer <archive.json> <comment-id> <reason>
  node ${self} undefer <archive.json> <comment-id>
  node ${self} reply <pr-number> <archive.json> <comment-id> <body>
  node ${self} edit-reply <pr-number> <archive.json> <comment-id> <body>
  node ${self} edit-comment <pr-number> <archive.json> <comment-id> <body>
`;
// GitHub returns numeric IDs; strings keep them exact past 2^53.
const idAsStringOne = '.id |= tostring | if has("in_reply_to_id") then .in_reply_to_id |= (if . == null then null else tostring end) else . end';
const idAsString = `[.[] | ${idAsStringOne}]`;
// 100 is GitHub's page-size maximum for REST and GraphQL.
const pageSize = 100;

function fail(message) {
  process.stderr.write(`${message}\n`);
  process.exit(2);
}

function gh(args, input) {
  const result = spawnSync('gh', args, {
    encoding: 'utf8',
    input,
    // 64 MiB: paginated PR comment JSON can exceed Node's 1 MiB default.
    maxBuffer: 64 * 1024 * 1024,
  });
  if (result.error) throw result.error;
  if (result.status !== 0) {
    throw new Error((result.stderr || result.stdout || `gh exited ${result.status}`).trim());
  }
  return result.stdout.trim();
}

function ghJson(args, input) {
  const output = gh(args, input);
  return output ? JSON.parse(output) : null;
}

function pagedApi(endpoint) {
  const pages = gh(['api', '--paginate', '--jq', idAsString, endpoint]);
  return pages ? pages.split('\n').map((page) => JSON.parse(page)) : [];
}

function pagedCommitShas(endpoint) {
  const pages = gh(['api', '--paginate', '--jq', '[.[] | .sha]', endpoint]);
  return pages ? pages.split('\n').flatMap((page) => JSON.parse(page)) : [];
}

function normalizeComment(comment) {
  return {
    id: String(comment.id),
    nodeId: comment.node_id ?? null,
    inReplyToId: comment.in_reply_to_id == null ? null : String(comment.in_reply_to_id),
    authorLogin: comment.user?.login ?? null,
    body: comment.body ?? '',
    createdAt: comment.created_at ?? null,
    updatedAt: comment.updated_at ?? null,
    url: comment.html_url ?? null,
    path: comment.path ?? null,
    line: comment.line ?? null,
    startLine: comment.start_line ?? null,
    side: comment.side ?? null,
    startSide: comment.start_side ?? null,
    diffHunk: comment.diff_hunk ?? null,
    commitSha: comment.commit_id ?? null,
    originalCommitSha: comment.original_commit_id ?? null,
  };
}

function normalizeIssueComment(comment) {
  return {
    id: String(comment.id),
    authorLogin: comment.user?.login ?? null,
    body: comment.body ?? '',
    createdAt: comment.created_at ?? null,
    updatedAt: comment.updated_at ?? null,
    url: comment.html_url ?? null,
  };
}

function normalizeReview(review) {
  return {
    id: String(review.id),
    authorLogin: review.user?.login ?? null,
    state: review.state ?? null,
    body: review.body ?? '',
    submittedAt: review.submitted_at ?? null,
    commitSha: review.commit_id ?? null,
    url: review.html_url ?? null,
  };
}

function graphql(query, variables) {
  const args = ['api', 'graphql', '-f', `query=${query}`];
  for (const [key, value] of Object.entries(variables)) {
    args.push('-F', `${key}=${value}`);
  }
  const result = ghJson(args);
  if (result.errors?.length) {
    throw new Error(result.errors.map(({ message }) => message).join('\n'));
  }
  return result.data;
}

async function readAllThreadCommentIds(thread) {
  const ids = thread.comments.nodes.map((comment) => comment.id);
  let cursor = thread.comments.pageInfo.endCursor;
  while (thread.comments.pageInfo.hasNextPage) {
    const query = `query($threadId: ID!, $cursor: String) {
      node(id: $threadId) {
        ... on PullRequestReviewThread {
          comments(first: ${pageSize}, after: $cursor) {
            nodes { id }
            pageInfo { hasNextPage endCursor }
          }
        }
      }
    }`;
    const data = graphql(query, { threadId: thread.id, cursor });
    const comments = data.node.comments;
    ids.push(...comments.nodes.map((comment) => comment.id));
    thread.comments.pageInfo = comments.pageInfo;
    cursor = comments.pageInfo.endCursor;
  }
  return ids;
}

async function fetchThreads(owner, name, number, commentsByNodeId) {
  const threads = [];
  const query = `query($owner: String!, $name: String!, $number: Int!, $cursor: String) {
    repository(owner: $owner, name: $name) {
      pullRequest(number: $number) {
        reviewThreads(first: ${pageSize}, after: $cursor) {
          nodes {
            id isResolved isOutdated path line startLine
            comments(first: ${pageSize}) {
              nodes { id }
              pageInfo { hasNextPage endCursor }
            }
          }
          pageInfo { hasNextPage endCursor }
        }
      }
    }
  }`;
  let cursor;
  while (true) {
    const data = graphql(query, {
      owner,
      name,
      number,
      ...(cursor ? { cursor } : {}),
    });
    const connection = data.repository?.pullRequest?.reviewThreads;
    if (!connection) throw new Error(`Pull request #${number} was not found in ${owner}/${name}.`);
    for (const remoteThread of connection.nodes) {
      const commentNodeIds = await readAllThreadCommentIds(remoteThread);
      const comments = commentNodeIds.map((nodeId) => commentsByNodeId.get(nodeId));
      if (comments.some((comment) => !comment)) {
        throw new Error(`GitHub returned a review thread with a comment missing from the REST response.`);
      }
      threads.push({
        threadId: remoteThread.id,
        rootCommentId: comments[0]?.id ?? null,
        path: remoteThread.path ?? comments[0]?.path ?? null,
        line: remoteThread.line ?? comments[0]?.line ?? null,
        startLine: remoteThread.startLine ?? comments[0]?.startLine ?? null,
        isResolved: remoteThread.isResolved,
        isOutdated: remoteThread.isOutdated,
        comments,
      });
    }
    if (!connection.pageInfo.hasNextPage) break;
    cursor = connection.pageInfo.endCursor;
  }
  return threads;
}

async function fetchSnapshot(prNumber) {
  const pullRequestUrl = ghJson([
    'pr', 'view', String(prNumber), '--json', 'url',
  ]).url;
  const pullRequestPath = new URL(pullRequestUrl).pathname;
  const match = pullRequestPath.match(/^\/([^/]+)\/([^/]+)\/pull\/(\d+)/);
  if (!match || Number(match[3]) !== prNumber) {
    throw new Error(`Could not identify the repository for PR #${prNumber}.`);
  }
  const [, owner, name] = match;
  const nameWithOwner = `${owner}/${name}`;

  const [developerLogin, pr, reviews, reviewComments, issueComments] = [
    gh(['api', 'user', '--jq', '.login']),
    ghJson(['api', `repos/${nameWithOwner}/pulls/${prNumber}`]),
    pagedApi(`repos/${nameWithOwner}/pulls/${prNumber}/reviews?per_page=${pageSize}`),
    pagedApi(`repos/${nameWithOwner}/pulls/${prNumber}/comments?per_page=${pageSize}`),
    pagedApi(`repos/${nameWithOwner}/issues/${prNumber}/comments?per_page=${pageSize}`),
  ];
  const commitShas = pagedCommitShas(
    `repos/${nameWithOwner}/pulls/${prNumber}/commits?per_page=${pageSize}`,
  );

  const flatComments = reviewComments.flat().map(normalizeComment);
  const commentsByNodeId = new Map(
    reviewComments.flat().map((comment, index) => [comment.node_id, flatComments[index]]),
  );
  const reviewThreads = await fetchThreads(owner, name, prNumber, commentsByNodeId);
  for (const thread of reviewThreads) {
    thread.pendingReply = !thread.isResolved &&
      thread.comments.at(-1)?.authorLogin !== developerLogin;
  }

  return {
    schemaVersion: 1,
    repository: nameWithOwner,
    pullRequest: {
      number: prNumber,
      url: pr.html_url,
      headSha: pr.head?.sha ?? null,
      commitShas,
    },
    fetchedAt: new Date().toISOString(),
    currentDeveloper: { login: developerLogin },
    reviewSummaries: reviews.flat().map(normalizeReview),
    conversationComments: issueComments.flat().map(normalizeIssueComment),
    reviewThreads,
  };
}

function archivePath(archiveFilePath) {
  const resolved = path.resolve(archiveFilePath);
  if (!resolved.endsWith('.address-comments.json')) {
    throw new Error(`Expected an archive path ending in .address-comments.json: ${archiveFilePath}`);
  }
  return resolved;
}

async function writeArchive(filePath, archive) {
  const temporaryPath = `${filePath}.${process.pid}.${randomUUID()}.tmp`;
  try {
    await mkdir(path.dirname(filePath), { recursive: true });
    await writeFile(temporaryPath, `${JSON.stringify(archive, null, 2)}\n`, { flag: 'wx' });
    await rename(temporaryPath, filePath);
  } catch (error) {
    await unlink(temporaryPath).catch(() => {});
    throw error;
  }
}

function staleCommitReferences(archive) {
  const currentShas = archive.pullRequest.commitShas.map((sha) => sha.toLowerCase());
  const stale = new Map();
  const ambiguous = new Map();
  const unverified = new Map();

  for (const thread of archive.reviewThreads) {
    for (const comment of thread.comments) {
      if (comment.authorLogin !== archive.currentDeveloper.login) continue;
      const links = comment.body.matchAll(
        /https?:\/\/[^/\s)]+\/([^/\s)]+\/[^/\s)]+)\/commit\/([0-9a-f]{7,40})/gi,
      );
      for (const [, repository, linkedSha] of links) {
        if (repository.toLowerCase() !== archive.repository.toLowerCase()) continue;
        const normalizedSha = linkedSha.toLowerCase();
        const matches = currentShas.filter((sha) =>
          sha.startsWith(normalizedSha) || normalizedSha.startsWith(sha),
        );
        if (matches.length === 1) continue;
        const bucket = currentShas.length === 0
          ? unverified
          : matches.length === 0 ? stale : ambiguous;
        const references = bucket.get(linkedSha) ?? [];
        references.push({
          commentId: comment.id,
          threadId: thread.threadId,
          url: comment.url,
        });
        bucket.set(linkedSha, references);
      }
    }
  }

  return { stale, ambiguous, unverified };
}

async function loadArchive(archiveFilePath) {
  const filePath = archivePath(archiveFilePath);
  let text;
  try {
    text = await readFile(filePath, 'utf8');
  } catch (error) {
    if (error.code === 'ENOENT') {
      throw new Error(`Archive not found: ${filePath}. Run sync first.`);
    }
    throw error;
  }
  const archive = JSON.parse(text);
  if (archive.schemaVersion !== 1 || !Array.isArray(archive.reviewThreads)) {
    throw new Error(`Unsupported or invalid comment archive: ${filePath}`);
  }
  return { filePath, archive };
}

function assertPullRequest(archive, prNumber) {
  if (archive.pullRequest.number !== prNumber) {
    throw new Error(`Archive belongs to PR #${archive.pullRequest.number}, not PR #${prNumber}.`);
  }
}

function findThread(archive, commentId) {
  const thread = archive.reviewThreads.find((item) =>
    item.comments.some((comment) => comment.id === commentId));
  if (!thread) {
    throw new Error(`Comment ${commentId} is not present in the archive for PR #${archive.pullRequest.number}.`);
  }
  return thread;
}

function assertCurrentDeveloper(archive) {
  const currentDeveloper = gh(['api', 'user', '--jq', '.login']);
  if (currentDeveloper !== archive.currentDeveloper.login) {
    throw new Error(`Archive developer is ${archive.currentDeveloper.login}; current gh user is ${currentDeveloper}. Run sync first.`);
  }
  return currentDeveloper;
}

async function sync(prNumber, archiveFilePath) {
  const filePath = archivePath(archiveFilePath);
  const snapshot = await fetchSnapshot(prNumber);
  let existing;
  try {
    existing = JSON.parse(await readFile(filePath, 'utf8'));
  } catch (error) {
    if (error.code !== 'ENOENT' && !(error instanceof SyntaxError)) throw error;
    if (error instanceof SyntaxError) {
      process.stdout.write(`Replacing unreadable archive ${filePath}.\n`);
    }
  }
  if (existing) {
    if (existing.repository !== snapshot.repository ||
        existing.pullRequest?.number !== snapshot.pullRequest.number) {
      throw new Error(`Archive identity does not match ${snapshot.repository}#${prNumber}: ${filePath}`);
    }
    // Deferral is local state; keep it while the thread is still pending.
    const deferredById = new Map((existing.reviewThreads ?? [])
      .filter((thread) => thread.deferred)
      .map((thread) => [thread.threadId, thread.deferred]));
    for (const thread of snapshot.reviewThreads) {
      const deferred = deferredById.get(thread.threadId);
      if (deferred && thread.pendingReply) thread.deferred = deferred;
    }
  }
  await writeArchive(filePath, snapshot);
  const { stale, ambiguous, unverified } = staleCommitReferences(snapshot);
  process.stdout.write(
    `Sync complete: ${snapshot.reviewThreads.length} review threads in ${filePath}.\n`,
  );
  reportStaleCommitReferences(stale, ambiguous, unverified, filePath);
}

function reportStaleCommitReferences(stale, ambiguous, unverified, filePath) {
  const groups = [
    [stale, (sha) => `Stale commit ${sha}`],
    [ambiguous, (sha) => `Commit SHA prefix ${sha} is ambiguous in the current PR commit list`],
    [unverified, (sha) => `Could not verify commit SHA ${sha} because the PR commit list is empty`],
  ];
  for (const [bucket, label] of groups) {
    for (const [sha, references] of bucket) {
      process.stdout.write(
        `${label(sha)}: ` +
        references.map(({ commentId, threadId, url }) =>
          `comment ${commentId} (thread ${threadId}${url ? `, ${url}` : ''})`,
        ).join(', ') +
        `; inspect with: node ${self} read-comment ${JSON.stringify(filePath)} ${references[0].commentId}\n`,
      );
    }
  }
  if (stale.size === 0 && ambiguous.size === 0 && unverified.size === 0) {
    process.stdout.write('No stale commit links found in your inline comments.\n');
  }
}

function pullRequestSummary(archive) {
  const { number, url, headSha } = archive.pullRequest;
  return { number, url, headSha };
}

async function readPending(archiveFilePath) {
  const { archive } = await loadArchive(archiveFilePath);
  const pendingThreads = archive.reviewThreads.filter((thread) => thread.pendingReply);
  const pending = pendingThreads
    .filter((thread) => !thread.deferred)
    .sort((left, right) => {
      const leftTime = left.comments.at(-1)?.createdAt ?? '';
      const rightTime = right.comments.at(-1)?.createdAt ?? '';
      return leftTime.localeCompare(rightTime);
    })[0] ?? null;
  process.stdout.write(`${JSON.stringify({
    repository: archive.repository,
    pullRequest: pullRequestSummary(archive),
    currentDeveloper: archive.currentDeveloper,
    deferredCount: pendingThreads.filter((thread) => thread.deferred).length,
    thread: pending,
  }, null, 2)}\n`);
}

async function readComment(archiveFilePath, commentId) {
  const { archive } = await loadArchive(archiveFilePath);
  const thread = findThread(archive, commentId);
  process.stdout.write(`${JSON.stringify({
    repository: archive.repository,
    pullRequest: pullRequestSummary(archive),
    currentDeveloper: archive.currentDeveloper,
    thread,
    selectedCommentId: commentId,
  }, null, 2)}\n`);
}

async function readContext(archiveFilePath) {
  const { archive } = await loadArchive(archiveFilePath);
  const { number, url } = archive.pullRequest;
  process.stdout.write(`${JSON.stringify({
    repository: archive.repository,
    pullRequest: { number, url },
    reviewSummaries: (archive.reviewSummaries ?? [])
      .filter((review) => review.body.trim() !== ''),
    conversationComments: archive.conversationComments ?? [],
  }, null, 2)}\n`);
}

async function setDeferred(archiveFilePath, commentId, reason) {
  const { filePath, archive } = await loadArchive(archiveFilePath);
  const thread = findThread(archive, commentId);
  if (reason === undefined) {
    delete thread.deferred;
  } else {
    thread.deferred = { reason, at: new Date().toISOString() };
  }
  await writeArchive(filePath, archive);
  process.stdout.write(`${reason === undefined ? 'Undeferred' : 'Deferred'} thread ${thread.threadId}.\n`);
}

async function reply(prNumber, archiveFilePath, commentId, body) {
  const { filePath, archive } = await loadArchive(archiveFilePath);
  assertPullRequest(archive, prNumber);
  // GitHub's replies endpoint takes the thread's top-level comment only.
  const thread = findThread(archive, commentId);
  const targetId = thread.rootCommentId ?? thread.comments[0].id;
  assertCurrentDeveloper(archive);
  const [owner, name] = archive.repository.split('/');
  const posted = ghJson([
    'api', '--method', 'POST', '--input', '-', '--jq', idAsStringOne,
    `repos/${owner}/${name}/pulls/${prNumber}/comments/${targetId}/replies`,
  ], JSON.stringify({ body }));
  const saved = normalizeComment(posted);
  saved.threadId = thread.threadId;
  thread.comments.push(saved);
  thread.pendingReply = !thread.isResolved && saved.authorLogin !== archive.currentDeveloper.login;
  if (!thread.pendingReply) delete thread.deferred;
  try {
    await writeArchive(filePath, archive);
  } catch (error) {
    throw new Error(`Reply ${saved.id} was posted, but the archive update failed: ${error.message}. Run sync after resolving the file write issue.`);
  }
  process.stdout.write(`Posted reply ${saved.id} on thread ${thread.threadId} and updated ${filePath}.\n`);
}

async function editComment(prNumber, archiveFilePath, commentId, body, requireReply = false) {
  const { filePath, archive } = await loadArchive(archiveFilePath);
  assertPullRequest(archive, prNumber);
  const currentDeveloper = assertCurrentDeveloper(archive);
  const thread = archive.reviewThreads.find((item) =>
    item.comments.some((comment) => comment.id === commentId));
  const comment = thread?.comments.find((item) => item.id === commentId);
  if (!comment || comment.authorLogin !== currentDeveloper ||
      (requireReply && comment.inReplyToId == null)) {
    throw new Error(`Comment ${commentId} is not an editable comment authored by the current developer in PR #${prNumber}.`);
  }
  const [owner, name] = archive.repository.split('/');
  const updated = ghJson([
    'api', '--method', 'PATCH', '--input', '-', '--jq', idAsStringOne,
    `repos/${owner}/${name}/pulls/comments/${commentId}`,
  ], JSON.stringify({ body }));
  comment.body = updated.body ?? body;
  comment.updatedAt = updated.updated_at ?? new Date().toISOString();
  comment.url = updated.html_url ?? comment.url;
  thread.pendingReply = !thread.isResolved &&
    thread.comments.at(-1)?.authorLogin !== currentDeveloper;
  try {
    await writeArchive(filePath, archive);
  } catch (error) {
    throw new Error(`Comment ${commentId} was edited, but the archive update failed: ${error.message}. Run sync after resolving the file write issue.`);
  }
  process.stdout.write(`Edited ${requireReply ? 'reply' : 'comment'} ${commentId} and updated ${filePath}.\n`);
}

function parsePrNumber(value) {
  if (!/^\d+$/.test(value ?? '')) throw new Error(`PR number must be numeric: ${value}`);
  return Number(value);
}

function parseCommentId(value) {
  if (!/^\d+$/.test(value ?? '')) throw new Error(`Comment ID must be numeric: ${value}`);
  return value;
}

async function main() {
  const [command, ...args] = process.argv.slice(2);
  switch (command) {
    case 'sync':
    case 'refresh-commits': // Alias kept for older handoffs.
      if (args.length !== 2) return fail(usage);
      return sync(parsePrNumber(args[0]), args[1]);
    case 'read-pending':
      if (args.length !== 1) return fail(usage);
      return readPending(args[0]);
    case 'read-comment':
      if (args.length !== 2) return fail(usage);
      return readComment(args[0], parseCommentId(args[1]));
    case 'read-context':
      if (args.length !== 1) return fail(usage);
      return readContext(args[0]);
    case 'defer':
      if (args.length !== 3 || args[2].trim() === '') return fail(usage);
      return setDeferred(args[0], parseCommentId(args[1]), args[2]);
    case 'undefer':
      if (args.length !== 2) return fail(usage);
      return setDeferred(args[0], parseCommentId(args[1]));
    case 'reply':
      if (args.length !== 4) return fail(usage);
      return reply(parsePrNumber(args[0]), args[1], parseCommentId(args[2]), args[3]);
    case 'edit-reply':
      if (args.length !== 4) return fail(usage);
      return editComment(parsePrNumber(args[0]), args[1], parseCommentId(args[2]), args[3], true);
    case 'edit-comment':
      if (args.length !== 4) return fail(usage);
      return editComment(parsePrNumber(args[0]), args[1], parseCommentId(args[2]), args[3]);
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
