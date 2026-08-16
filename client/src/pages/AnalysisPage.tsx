import { TraceWizard } from '../components/analysis/TraceWizard'
import { ReportView } from '../components/report/ReportView'
import type { useAnalysis } from '../hooks/useAnalysis'

interface AnalysisPageProps {
  /** Owned by the shell so a finished report survives navigating away and back. */
  analysis: ReturnType<typeof useAnalysis>
}

export function AnalysisPage({ analysis }: AnalysisPageProps) {
  const { report, submitting, error, submit, reset } = analysis

  if (report) return <ReportView report={report} onNewAnalysis={reset} />

  // The failure is handed to the wizard rather than banner-ed above it: the
  // submit button is at the foot of a long form, and a message at the top of the
  // page is off-screen exactly when it is needed.
  return (
    <TraceWizard
      onSubmit={submit}
      submitting={submitting}
      error={error}
      onDismissError={reset}
    />
  )
}
