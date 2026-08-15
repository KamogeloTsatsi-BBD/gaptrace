import { TraceWizard } from '../components/analysis/TraceWizard'
import { ReportView } from '../components/report/ReportView'
import { Notice } from '../components/ui/Notice'
import type { useAnalysis } from '../hooks/useAnalysis'

/** Failures the user can act on themselves, and what to tell them. */
const RECOVERY_HINTS: Readonly<Record<string, string>> = {
  source_unavailable: 'That link could not be fetched. Paste the diff instead.',
  invalid_input: 'Check the requirement text and the code source, then try again.',
}

interface AnalysisPageProps {
  /** Owned by the shell so a finished report survives navigating away and back. */
  analysis: ReturnType<typeof useAnalysis>
}

export function AnalysisPage({ analysis }: AnalysisPageProps) {
  const { report, submitting, error, submit, reset } = analysis

  if (report) return <ReportView report={report} onNewAnalysis={reset} />

  return (
    <>
      {error ? (
        <Notice
          tone="error"
          title="Analysis could not run."
        >
          {error.message} {RECOVERY_HINTS[error.code] ?? ''}
        </Notice>
      ) : null}

      <TraceWizard onSubmit={submit} submitting={submitting} />
    </>
  )
}
