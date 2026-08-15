import { useMemo } from 'react'
import { CriterionCard } from './CriterionCard'
import { ScopeNote } from './ScopeNote'
import { StatGrid, type Stat } from '../ui/StatGrid'
import { CATEGORY_LABELS, formatDateTime } from '../../lib/format'
import type { AnalysisReport } from '../../types/domain'

interface ReportViewProps {
  report: AnalysisReport
  onNewAnalysis: () => void
}

/** Reads the server's `summary` rather than counting the criteria again. */
function toStats(report: AnalysisReport): Stat[] {
  const { total, byStatus } = report.summary
  return [
    { label: 'criteria checked', value: total },
    { label: 'full', value: byStatus.full },
    { label: 'gaps found', value: byStatus.partial + byStatus.missing },
    { label: 'needs review', value: byStatus.needs_review },
  ]
}

export function ReportView({ report, onNewAnalysis }: ReportViewProps) {
  const stats = useMemo(() => toStats(report), [report])
  const { gapsByCategory } = report.summary

  return (
    <section className="report" aria-labelledby="report-title">
      <header className="report-header">
        <section>
          <p className="eyebrow">Analysis report</p>
          <h1 id="report-title">Evidence for every criterion.</h1>
          <p>Created {formatDateTime(report.createdAt)}</p>
        </section>
        <button type="button" onClick={onNewAnalysis}>
          New analysis
        </button>
      </header>

      <StatGrid label="Report summary" stats={stats} />

      {report.prReference === null ? null : (
        <p className="source-reference">
          Source:{' '}
          <a href={report.prReference} target="_blank" rel="noreferrer">
            {report.prReference}
          </a>
        </p>
      )}

      {gapsByCategory.length === 0 ? null : (
        <section className="gap-categories" aria-labelledby="gap-categories-title">
          <h2 id="gap-categories-title">Where the gaps fell</h2>
          <ol>
            {gapsByCategory.map((entry) => (
              <li key={entry.category}>
                <span>{CATEGORY_LABELS[entry.category]}</span>
                <strong>{entry.count}</strong>
              </li>
            ))}
          </ol>
        </section>
      )}

      <ScopeNote scope={report.scope} />

      <section className="criteria-list" aria-labelledby="criteria-title">
        <header>
          <h2 id="criteria-title">Criterion verdicts</h2>
          <p>
            Status reflects the supplied change only. Read the cited evidence before signing
            off.
          </p>
        </header>
        {report.criteria.map((criterion, index) => (
          <CriterionCard key={criterion.id} criterion={criterion} number={index + 1} />
        ))}
      </section>
    </section>
  )
}
