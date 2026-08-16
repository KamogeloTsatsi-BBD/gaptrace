/**
 * Which changed files did no criterion cite? Computed from evidence the
 * comparator already produced, so it adds no model call.
 *
 * A proxy, not a measurement: tests, refactors and generated output go uncited
 * for innocent reasons. Meaningful in aggregate, not as a verdict on one PR.
 */
import type { EvaluatedCriterion, ScopeSignal } from '../types.js'

const MAX_LISTED = 50

/** The b-side is taken so a renamed file is attributed to where it ended up. */
const FILE_HEADER = /^diff --git (?:"?a\/(.+?)"?) (?:"?b\/(.+?)"?)$/gm

/**
 * The model cites paths "as they appear in the diff", which means with or
 * without the a/ or b/ prefix. Without normalising both sides every file reads
 * as uncited.
 */
function normalise(path: string): string {
  return path.trim().replace(/^[ab]\//, '')
}

function changedFilesIn(diffText: string): string[] {
  const files = new Set<string>()

  // Built fresh: a /g regex carries lastIndex across calls.
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
    // Counted from the diff's own files, so a hallucinated path can't inflate it.
    citedFiles: changed.length - uncited.length,
    uncitedFiles: uncited.slice(0, MAX_LISTED),
    uncitedRatio: changed.length === 0 ? 0 : uncited.length / changed.length,
  }
}
