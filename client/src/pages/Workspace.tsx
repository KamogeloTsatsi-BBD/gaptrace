import { Suspense, lazy, useCallback, useState, useTransition, useEffect } from 'react'
import { AppShell, type AppPage } from '../components/layout/AppShell'
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

const PAGE_META: Record<AppPage, { title: string; description: string }> = {
  analysis: {
    title: 'New Analysis — Gaptrace',
    description:
      'Submit acceptance criteria and a code diff or PR link. Get evidence-grounded verdicts for every criterion before merging.',
  },
  insights: {
    title: 'Insights — Gaptrace',
    description:
      'Review cross-report patterns, recurring gap categories, and delivery trends.',
  },
}

const CANONICAL_BASE = typeof window !== 'undefined' ? window.location.origin : ''

function updatePageMeta(title: string, description: string) {
  if (document.title !== title) document.title = title
  let metaDesc = document.querySelector('meta[name="description"]')
  if (!metaDesc) {
    metaDesc = document.createElement('meta')
    metaDesc.setAttribute('name', 'description')
    document.head.appendChild(metaDesc)
  }
  metaDesc.setAttribute('content', description)

  let canonical = document.querySelector('link[rel="canonical"]') as HTMLLinkElement | null
  if (!canonical) {
    canonical = document.createElement('link')
    canonical.setAttribute('rel', 'canonical')
    document.head.appendChild(canonical)
  }
  canonical.setAttribute('href', CANONICAL_BASE + '/')
}

export function Workspace() {
  const { accessToken } = useAuth()
  const [page, setPage] = useState<AppPage>('analysis')
  // Held here, not in the page: navigating away and back must not discard a
  // report that cost one model call per criterion.
  const analysis = useAnalysis(accessToken)
  // Keeps the current page interactive while the insights chunk loads.
  const [, startTransition] = useTransition()

  const navigate = useCallback((next: AppPage) => {
    startTransition(() => setPage(next))
  }, [])

  useEffect(() => {
    const meta = PAGE_META[page]
    updatePageMeta(meta.title, meta.description)
  }, [page])

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
