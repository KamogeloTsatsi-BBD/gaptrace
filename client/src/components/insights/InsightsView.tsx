import { useMemo } from 'react'
import { CategoryBreakdown } from './CategoryBreakdown'
import { NarrativeCardView } from './NarrativeCardView'
import { UnsettledCriteria } from './UnsettledCriteria'
import { LoadingPanel } from '../ui/LoadingPanel'
import { StatGrid, type Stat } from '../ui/StatGrid'
import { formatDateTime, formatRate } from '../../lib/format'
import type { InsightsResponse } from '../../types/api'
import type { InsightSubstrate } from '../../types/domain'

const NARRATING_LINES: readonly string[] = [
  'Counting the gaps…',
  'Grouping them by category…',
  'Looking for what keeps recurring…',
  'Separating patterns from one-offs…',
  'Writing it up…',
]

interface InsightsViewProps {
  data: InsightsResponse | null
  loading: boolean
  error: string
  generating: boolean
  generateError: string
  onGenerate: () => void
}

function toStats(substrate: InsightSubstrate): Stat[] {
  return [
    { label: 'analyses', value: substrate.analysisCount },
    { label: 'criteria analysed', value: substrate.criterionCount },
    { label: 'gaps found', value: substrate.gapCount },
    { label: 'gap rate', value: formatRate(substrate.gapRate) },
    { label: 'needed review', value: formatRate(substrate.needsReviewRate) },
    { label: 'not checkable from code', value: formatRate(substrate.notVerifiableRate) },
  ]
}

/** Presentational: the call that costs money arrives as `onGenerate`. */
export function InsightsView({
  data,
  loading,
  error,
  generating,
  generateError,
  onGenerate,
}: InsightsViewProps) {
  const substrate = data?.substrate ?? null
  const stats = useMemo(() => (substrate ? toStats(substrate) : []), [substrate])

  if (loading) {
    return (
      <section className="empty-state">
        <p>Counting the evidence across past analyses…</p>
      </section>
    )
  }

  if (error) {
    return (
      <section className="empty-state">
        <h1>Insights are unavailable</h1>
        <p>{error}</p>
      </section>
    )
  }

  if (!data || !substrate || substrate.analysisCount === 0) {
    return (
      <section className="empty-state">
        <h1>No analyses yet</h1>
        <p>Run an analysis and the patterns across your reports will appear here.</p>
      </section>
    )
  }

  const narrative = data.narrative
  const canGenerate = data.canNarrate && (data.stale || !narrative)

  return (
    <section className="insights" aria-labelledby="insights-title">
      <header className="section-heading">
        <p className="eyebrow">Across past analyses</p>
        <h1 id="insights-title">Patterns, grounded in delivery evidence.</h1>
        <p>
          Every number here is counted from your analyses. The written findings below are
          generated, and their likely causes are presented as hypotheses, not facts.
        </p>
      </header>

      <StatGrid label="Gap statistics" stats={stats} />

      <CategoryBreakdown categories={substrate.categories} />
      <UnsettledCriteria criteria={substrate.unsettledCriteria} />

      <section className="narrative-list" aria-labelledby="findings-title">
        <header className="narrative-header">
          <section>
            <h2 id="findings-title">Grounded findings</h2>
            <p className="field-help">
              {narrative
                ? `Generated ${formatDateTime(narrative.generatedAt)} across ${narrative.analysisCount} analyses.`
                : 'Not generated yet. The numbers above are always current and cost nothing.'}
            </p>
          </section>
          {/* The only control in the app that spends money, so it is an
              explicit gesture and it retires once the numbers it was
              generated from stop moving. */}
          {canGenerate ? (
            <button type="button" onClick={onGenerate} disabled={generating}>
              {generating
                ? 'Generating…'
                : narrative
                  ? 'Regenerate for current numbers'
                  : 'Generate findings'}
            </button>
          ) : null}
        </header>

        {generateError ? (
          <p className="form-message" role="alert">
            {generateError}
          </p>
        ) : null}

        {/* Announced once here; the panel's own rotating line is aria-hidden. */}
        <p className="visually-hidden" role="status">
          {generating ? 'Generating findings…' : ''}
        </p>

        {generating ? (
          <LoadingPanel
            id="narrative-progress-title"
            title="Writing the findings"
            lines={NARRATING_LINES}
          />
        ) : (
          narrative?.cards.map((card) => (
            <NarrativeCardView key={card.finding} card={card} />
          ))
        )}
      </section>
    </section>
  )
}
