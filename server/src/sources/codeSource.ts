/** Whatever the user gave us -> diff text. Nothing downstream knows which. */
import { InvalidInputError, SourceUnavailableError } from '../lib/errors.js'
import { MAX_DIFF_CHARS } from '../services/groundedComparator.js'

const FETCH_TIMEOUT_MS = 15_000

export type CodeSourceInput =
  | { kind: 'diff'; diffText: string }
  | { kind: 'pr'; prUrl: string }

export interface ResolvedCode {
  diffText: string
  /** The PR/MR URL when link-ingested, else null. */
  prReference: string | null
}

// The SSRF guard: the outbound URL is rebuilt from the captured parts, so
// nothing user-supplied but owner/repo/number reaches the fetch.
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

function toDiffUrl(prUrl: string): string {
  for (const { pattern, diffUrl } of PR_PATTERNS) {
    const match = pattern.exec(prUrl.trim())
    if (match) return diffUrl(match.slice(1))
  }

  throw new InvalidInputError(
    'Not a recognised pull request URL. Expected a public github.com/…/pull/N or gitlab.com/…/-/merge_requests/N link.',
  )
}

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

  // A 200 is not enough: for an issue number, GitHub redirects …/pull/N.diff
  // to …/issues/N and serves HTML, which would reach the model as a diff.
  const contentType = response.headers.get('content-type') ?? ''
  if (!contentType.startsWith('text/plain')) {
    throw new SourceUnavailableError(
      "That link didn't return a diff. Check it points at a pull request and not an issue.",
    )
  }

  // Checked before buffering, so an enormous PR is rejected rather than read in.
  const declared = Number(response.headers.get('content-length'))
  if (Number.isFinite(declared) && declared > MAX_DIFF_CHARS) {
    throw new SourceUnavailableError(
      `That pull request's diff is too large to analyse (limit ${MAX_DIFF_CHARS} characters). Analyse a smaller PR.`,
    )
  }

  const diffText = await response.text()

  // A body with no file header is not a diff, whatever it was served as.
  if (!/^diff --git |^--- |^Index: |^From [0-9a-f]{7,}/m.test(diffText)) {
    throw new SourceUnavailableError(
      "That link didn't return a diff. Check it points at a pull request and not an issue.",
    )
  }

  return diffText
}

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
