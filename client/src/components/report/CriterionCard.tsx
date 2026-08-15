import { memo } from 'react'
import { EvidenceList } from './EvidenceList'
import { StatusBadge } from './StatusBadge'
import { CATEGORY_LABELS, formatRate } from '../../lib/format'
import { isGap, type EvaluatedCriterion } from '../../types/domain'

interface CriterionCardProps {
  criterion: EvaluatedCriterion
  number: number
}

/**
 * One verdict, with the evidence that produced it. Memoised because a report
 * can carry dozens of these and nothing about a card changes once the report
 * has loaded.
 */
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
        {/* The guard, not a null check: only partial and missing carry a
            category, and the discriminated union says so. */}
        {isGap(criterion) ? (
          <span className="category">{CATEGORY_LABELS[criterion.category]}</span>
        ) : null}
        <span className="confidence">Confidence {formatRate(criterion.confidence)}</span>
      </footer>
    </article>
  )
})
