import type { UnsettledCriterion } from '../../types/domain'

const KIND_LABELS: Readonly<Record<UnsettledCriterion['kind'], string>> = {
  not_verifiable: 'Not checkable from code',
  needs_review: 'Could not be settled',
}

/**
 * The analyst-facing half of the dashboard: criteria whose *wording*, not
 * whose code, was the problem. Counts alone would say "a third needs review";
 * quoting the criteria says which sentences to rewrite.
 */
export function UnsettledCriteria({
  criteria,
}: {
  criteria: readonly UnsettledCriterion[]
}) {
  if (criteria.length === 0) return null

  return (
    <section className="unsettled" aria-labelledby="unsettled-title">
      <h2 id="unsettled-title">Criteria that could not be judged</h2>
      <p className="field-help">
        These are candidates for rewording before the next ticket, not defects in the code.
      </p>
      <ul>
        {criteria.map((criterion) => (
          <li key={`${criterion.kind}:${criterion.criterionText}`}>
            <span className={`unsettled-kind unsettled-kind--${criterion.kind}`}>
              {KIND_LABELS[criterion.kind]}
            </span>
            <p className="unsettled-text">{criterion.criterionText}</p>
            <p className="field-help">{criterion.reason}</p>
          </li>
        ))}
      </ul>
    </section>
  )
}
