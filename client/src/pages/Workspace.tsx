import { Suspense, lazy, useCallback, useState, useTransition } from 'react'
import { AppShell, type AppPage } from '../components/layout/AppShell'
import { AnalysisPage } from './AnalysisPage'
import { useAnalysis } from '../hooks/useAnalysis'
import { useAuth } from '../auth/useAuth'

// Most sessions only run an analysis, so the dashboard loads on first navigation.
const InsightsPage = lazy(() => import('./InsightsPage'))

const InsightsFallback = (
  <section className="empty-state">
    <p>Loading insights…</p>
  </section>
)

export function Workspace() {
  const { accessToken } = useAuth()
  const [page, setPage] = useState<AppPage>('analysis')
  // Held here rather than in the page: navigating to insights and back must
  // not throw away a report that took a model call per criterion to produce.
  const analysis = useAnalysis(accessToken)
  // Keeps the current page interactive while the insights chunk loads, instead
  // of blanking the shell the instant the nav item is clicked.
  const [, startTransition] = useTransition()

  const navigate = useCallback((next: AppPage) => {
    startTransition(() => setPage(next))
  }, [])

  return (
    <AppShell page={page} onNavigate={navigate}>
      {page === 'insights' ? (
        <Suspense fallback={InsightsFallback}>
          <InsightsPage />
        </Suspense>
      ) : (
        <AnalysisPage analysis={analysis} />
      )}
    </AppShell>
  )
}
