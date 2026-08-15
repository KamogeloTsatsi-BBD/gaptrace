/**
 * The scope-creep proxy: which changed files did no criterion cite?
 *
 * Computed from evidence the comparator already produced, so it adds no model
 * call. The pipeline only ever asks criteria -> diff ("is this satisfied?");
 * this is the cheapest available read of the opposite direction ("did anyone
 * ask for this?").
 *
 * Treat it as a proxy. A file cited for one hunk may contain plenty besides,
 * and test files, refactors and generated output go uncited for innocent
 * reasons. It earns its keep in aggregate across many analyses, not as a
 * verdict on a single PR.
 */
import type { EvaluatedCriterion, ScopeSignal } from '../types.js'

/** Enough to name the pattern in a report without bloating the payload. */
const MAX_LISTED = 50

/**
 * `diff --git a/path b/path`. The b-side is taken because it is the post-change
 * path — a renamed file should be attributed to where it ended up. Quoted
 * paths (those with spaces or non-ASCII) are matched too.
 */
const FILE_HEADER = /^diff --git (?:"?a\/(.+?)"?) (?:"?b\/(.+?)"?)$/gm

/**
 * The model is told to cite paths "as they appear in the diff", which in
 * practice means with or without the a/ or b/ prefix depending on the call.
 * Normalise both sides before comparing, or every file reads as uncited.
 */
function normalise(path: string): string {
  return path.trim().replace(/^[ab]\//, '')
}

function changedFilesIn(diffText: string): string[] {
  const files = new Set<string>()

  // A regex with /g carries lastIndex across calls, so it is built fresh here
  // rather than shared at module scope.
  const pattern = new RegExp(FILE_HEADER.source, 'gm')
  let match: RegExpExecArray | null

  while ((match = pattern.exec(diffText)) !== null) {
    files.add(normalise(match[2] ?? match[1]))
  }

  return [...files]
}

export function computeScopeSignal(
  diffText: string,
  criteria: readonly EvaluatedCriterion[],
): ScopeSignal {
  const changed = changedFilesIn(diffText)

  const cited = new Set<string>()
  for (const criterion of criteria) {
    if (criterion.evidence === 'none') continue
    for (const hunk of criterion.evidence) cited.add(normalise(hunk.file))
  }

  const uncited = changed.filter((file) => !cited.has(file))

  return {
    changedFiles: changed.length,
    // Only citations that landed on a file actually in the diff count; a
    // hallucinated path must not inflate coverage.
    citedFiles: changed.length - uncited.length,
    uncitedFiles: uncited.slice(0, MAX_LISTED),
    uncitedRatio: changed.length === 0 ? 0 : uncited.length / changed.length,
  }
}
