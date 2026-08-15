import { Suspense, lazy, useCallback, useState, useTransition } from 'react'
import { AppShell, type AppPage } from '../components/layout/AppShell'
import { Notice } from '../components/ui/Notice'
import { AnalysisPage } from './AnalysisPage'
import { useAnalysis } from '../hooks/useAnalysis'
import { useAuth } from '../auth/useAuth'

// Split out of the chunk that renders the form; resolved on first navigation.
const InsightsPage = lazy(() => import('./InsightsPage'))

const InsightsFallback = (
  <section className="empty-state">
    <p>Loading insights…</p>
  </section>
)

export function Workspace() {
  const { accessToken, configured } = useAuth()
  const [page, setPage] = useState<AppPage>('analysis')
  // Held here, not in the page: navigating away and back must not discard a
  // report that cost one model call per criterion.
  const analysis = useAnalysis(accessToken)
  // Keeps the current page interactive while the insights chunk loads.
  const [, startTransition] = useTransition()

  const navigate = useCallback((next: AppPage) => {
    startTransition(() => setPage(next))
  }, [])

  return (
    <AppShell page={page} onNavigate={navigate}>
      {configured ? null : (
        <Notice tone="info" title="Demo configuration">
          Add Supabase values to <code>.env</code> to enable email authentication. The UI
          uses example data until the API is available.
        </Notice>
      )}

      {page === 'insights' ? (
        <Suspense fallback={InsightsFallback}>
          <InsightsPage />
        </Suspense>
      ) : (
        <AnalysisPage analysis={analysis} demoMode={!configured} />
      )}
    </AppShell>
  )
}
