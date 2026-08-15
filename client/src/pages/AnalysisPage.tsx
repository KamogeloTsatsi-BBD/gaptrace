import { useCallback } from 'react'
import { AnalysisForm } from '../components/analysis/AnalysisForm'
import { ReportView } from '../components/report/ReportView'
import { Notice } from '../components/ui/Notice'
import { exampleReport } from '../data/exampleReport'
import type { useAnalysis } from '../hooks/useAnalysis'

/** Failures the user can act on themselves, and what to tell them. */
const RECOVERY_HINTS: Readonly<Record<string, string>> = {
  source_unavailable: 'That link could not be fetched. Paste the diff instead.',
  invalid_input: 'Check the requirement text and the code source, then try again.',
}

interface AnalysisPageProps {
  /** Owned by the shell so a finished report survives navigating away and back. */
  analysis: ReturnType<typeof useAnalysis>
  /** True when there is no backend to talk to; offers the example instead. */
  demoMode: boolean
}

export function AnalysisPage({ analysis, demoMode }: AnalysisPageProps) {
  const { report, submitting, error, submit, reset, showReport } = analysis
  const openExample = useCallback(() => showReport(exampleReport), [showReport])

  if (report) return <ReportView report={report} onNewAnalysis={reset} />

  return (
    <>
      {error ? (
        <Notice
          tone="error"
          title="Analysis could not run."
          action={
            demoMode ? (
              <button type="button" onClick={openExample}>
                Open an example report
              </button>
            ) : undefined
          }
        >
          {error.message} {RECOVERY_HINTS[error.code] ?? ''}
        </Notice>
      ) : null}

      <AnalysisForm onSubmit={submit} submitting={submitting} />

      {demoMode ? (
        <section className="demo-callout">
          <h2>Explore the report experience</h2>
          <p>The backend is not configured in this workspace yet.</p>
          <button type="button" onClick={openExample}>
            Open example report
          </button>
        </section>
      ) : null}
    </>
  )
}
