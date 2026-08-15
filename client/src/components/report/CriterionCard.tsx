import { memo } from 'react'
import { EvidenceList } from './EvidenceList'
import { StatusBadge } from './StatusBadge'
import { CATEGORY_LABELS, formatRate } from '../../lib/format'
import { isGap, type EvaluatedCriterion } from '../../types/domain'

interface CriterionCardProps {
  criterion: EvaluatedCriterion
  number: number
}

/** Memoised: a report carries dozens, and none change once it has loaded. */
export const CriterionCard = memo(function CriterionCard({
  criterion,
  number,
}: CriterionCardProps) {
  return (
    <article className={`criterion-card criterion-card--${criterion.status}`}>
      <header>
        <p className="criterion-number">Criterion {number}</p>
        <StatusBadge status={criterion.status} />
        <h3>{criterion.text}</h3>
      </header>

      <section aria-label="Verdict reasoning">
        <h4>Verdict</h4>
        <p>{criterion.reason}</p>
        {criterion.verifiable ? null : (
          <p className="field-help">
            This criterion cannot be judged from code, so no diff comparison was attempted.
          </p>
        )}
      </section>

      <section aria-label="Evidence">
        <h4>Evidence</h4>
        <EvidenceList evidence={criterion.evidence} />
      </section>

      <footer>
        {/* The guard, not a null check — the union says only gaps have one. */}
        {isGap(criterion) ? (
          <span className="category">{CATEGORY_LABELS[criterion.category]}</span>
        ) : null}
        <span className="confidence">Confidence {formatRate(criterion.confidence)}</span>
      </footer>
    </article>
  )
})
