import { formatRate } from '../../lib/format'
import type { ScopeSignal } from '../../types/domain'

/** Below this the signal is noise — a couple of uncited test files prove nothing. */
const MIN_UNCITED_RATIO = 0.5

/**
 * Files the diff changed that no criterion cited.
 *
 * Framed as a prompt, never a verdict: a file cited for one hunk may contain
 * plenty besides, and tests, refactors and generated files go uncited for
 * entirely innocent reasons. Stating it as a finding would be the one place
 * this product overclaims.
 */
export function ScopeNote({ scope }: { scope: ScopeSignal }) {
  if (scope.changedFiles === 0 || scope.uncitedRatio < MIN_UNCITED_RATIO) return null

  return (
    <section className="scope-note" aria-labelledby="scope-note-title">
      <h2 id="scope-note-title">Changes no criterion accounted for</h2>
      <p>
        {scope.citedFiles} of {scope.changedFiles} changed files were cited as evidence
        ({formatRate(scope.uncitedRatio)} went uncited). That often means tests or
        refactors — worth a glance, not a finding.
      </p>
      <ul className="uncited-files">
        {scope.uncitedFiles.map((file) => (
          <li key={file}>
            <code>{file}</code>
          </li>
        ))}
      </ul>
    </section>
  )
}
