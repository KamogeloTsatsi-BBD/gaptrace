import { memo } from 'react'
import { AUDIENCE_LABELS, SEVERITY_LABELS } from '../../lib/format'
import type { NarrativeCard } from '../../types/domain'

/**
 * The three fields are labelled separately and deliberately: a grounding
 * statistic quotes a real number, a hypothesis is a guess about cause, and the
 * two must never be read as the same kind of claim. An insight layer that
 * blurs them stops being trusted.
 */
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
