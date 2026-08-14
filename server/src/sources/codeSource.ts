/**
 * CodeSource adapter: whatever the user gave us -> diff text.
 *
 * Runs in front of the pipeline, so nothing downstream knows or cares whether
 * the diff was pasted or fetched. Adding an authenticated source later means
 * adding a branch here and nothing else.
 */
import { InvalidInputError, SourceUnavailableError } from '../lib/errors.js'
import { MAX_DIFF_CHARS } from '../services/groundedComparator.js'

/** Fetching a diff shouldn't hold an analysis request open. */
const FETCH_TIMEOUT_MS = 15_000

export type CodeSourceInput =
  | { kind: 'diff'; diffText: string }
  | { kind: 'pr'; prUrl: string }

export interface ResolvedCode {
  diffText: string
  /** The PR/MR URL when link-ingested, so the report can link back to it. */
  prReference: string | null
}

/**
 * Only these two forms are recognised, and the fetch URL is rebuilt from the
 * captured parts rather than from the string the user sent. That's the SSRF
 * guard: an attacker can't smuggle an internal host through, because nothing
 * of theirs but owner/repo/number survives into the outbound request.
 */
const PR_PATTERNS: readonly {
  host: string
  pattern: RegExp
  diffUrl: (groups: string[]) => string
}[] = [
  {
    host: 'github.com',
    pattern: /^https:\/\/github\.com\/([\w.-]+)\/([\w.-]+)\/pull\/(\d+)(?:[/?#]|$)/,
    diffUrl: ([owner, repo, number]) => `https://github.com/${owner}/${repo}/pull/${number}.diff`,
  },
  {
    host: 'gitlab.com',
    pattern: /^https:\/\/gitlab\.com\/([\w.-]+(?:\/[\w.-]+)*)\/-\/merge_requests\/(\d+)(?:[/?#]|$)/,
    diffUrl: ([path, number]) => `https://gitlab.com/${path}/-/merge_requests/${number}.diff`,
  },
]

/** @throws {InvalidInputError} when the URL isn't a recognised public PR/MR. */
function toDiffUrl(prUrl: string): string {
  for (const { pattern, diffUrl } of PR_PATTERNS) {
    const match = pattern.exec(prUrl.trim())
    if (match) return diffUrl(match.slice(1))
  }

  throw new InvalidInputError(
    'Not a recognised pull request URL. Expected a public github.com/…/pull/N or gitlab.com/…/-/merge_requests/N link.',
  )
}

/**
 * @throws {InvalidInputError} when the URL isn't a recognised public PR/MR.
 * @throws {SourceUnavailableError} when the diff can't be retrieved.
 */
async function fetchPrDiff(prUrl: string): Promise<string> {
  const diffUrl = toDiffUrl(prUrl)

  let response: Response
  try {
    response = await fetch(diffUrl, {
      headers: { accept: 'text/plain' },
      signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
      redirect: 'follow',
    })
  } catch {
    // Network failure or timeout. The cause is deliberately not surfaced —
    // it's noise to the user, and the paste path is always available.
    throw new SourceUnavailableError(
      "Couldn't reach the host to fetch that diff. Paste the diff instead.",
    )
  }

  if (response.status === 404 || response.status === 403) {
    throw new SourceUnavailableError(
      'That pull request looks private or no longer exists. Paste the diff instead.',
    )
  }
  if (!response.ok) {
    throw new SourceUnavailableError(
      `The host returned ${response.status} for that pull request. Paste the diff instead.`,
    )
  }

  // A 200 is not enough. When the number belongs to an issue rather than a
  // pull request, GitHub redirects …/pull/N.diff to …/issues/N and serves the
  // issue page with a 200 — a quarter-megabyte of HTML that would sail into
  // the model as if it were a diff. Both hosts serve real diffs as text/plain.
  const contentType = response.headers.get('content-type') ?? ''
  if (!contentType.startsWith('text/plain')) {
    throw new SourceUnavailableError(
      "That link didn't return a diff. Check it points at a pull request and not an issue.",
    )
  }

  // Check the advertised size before buffering, so an enormous PR is rejected
  // rather than pulled into memory only to fail the length check below.
  const declared = Number(response.headers.get('content-length'))
  if (Number.isFinite(declared) && declared > MAX_DIFF_CHARS) {
    throw new SourceUnavailableError(
      `That pull request's diff is too large to analyse (limit ${MAX_DIFF_CHARS} characters). Analyse a smaller PR.`,
    )
  }

  const diffText = await response.text()

  // Belt to the content-type's braces: a diff that carries no file header is
  // not a diff, whatever it was served as.
  if (!/^diff --git |^--- |^Index: |^From [0-9a-f]{7,}/m.test(diffText)) {
    throw new SourceUnavailableError(
      "That link didn't return a diff. Check it points at a pull request and not an issue.",
    )
  }

  return diffText
}

/**
 * @throws {InvalidInputError} when the input is empty or the URL is unrecognised.
 * @throws {SourceUnavailableError} when a linked diff can't be retrieved.
 */
export async function resolveCodeSource(input: CodeSourceInput): Promise<ResolvedCode> {
  if (input.kind === 'diff') {
    if (input.diffText.trim().length === 0) {
      throw new InvalidInputError('Diff is empty.')
    }
    return { diffText: input.diffText, prReference: null }
  }

  const diffText = await fetchPrDiff(input.prUrl)

  if (diffText.trim().length === 0) {
    throw new SourceUnavailableError(
      'That pull request has an empty diff — there is nothing to analyse.',
    )
  }

  return { diffText, prReference: input.prUrl.trim() }
}
