import { memo } from 'react'
import { AUDIENCE_LABELS, SEVERITY_LABELS } from '../../lib/format'
import type { NarrativeCard } from '../../types/domain'

/** The fields are labelled separately so a hypothesis never reads as a statistic. */
export const NarrativeCardView = memo(function NarrativeCardView({
  card,
}: {
  card: NarrativeCard
}) {
  return (
    <article className="insight-card">
      <header>
        <span className={`severity severity--${card.severity}`}>
          {SEVERITY_LABELS[card.severity]}
        </span>
        <span className={`audience audience--${card.audience}`}>
          {AUDIENCE_LABELS[card.audience]}
        </span>
        <h3>{card.finding}</h3>
      </header>
      <dl>
        <dt>Grounding statistic</dt>
        <dd>{card.groundingStat}</dd>
        <dt>Hypothesis</dt>
        <dd>{card.hypothesis}</dd>
        <dt>Suggested action</dt>
        <dd>{card.suggestedAction}</dd>
      </dl>
    </article>
  )
})
