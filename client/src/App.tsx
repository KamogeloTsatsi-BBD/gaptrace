import { useEffect } from 'react'
import { AuthForm } from './components/auth/AuthForm'
import { Workspace } from './pages/Workspace'
import { useAuth } from './auth/useAuth'

const CANONICAL_BASE = typeof window !== 'undefined' ? window.location.origin : ''

function setMetaTag(attr: string, value: string) {
  let el = document.head.querySelector(`meta[${attr}="${value}"]`)
  if (!el) {
    el = document.createElement('meta')
    if (attr === 'name') el.setAttribute('name', value)
    else if (attr === 'property') el.setAttribute('property', value)
  }
  return el
}

function updatePageMeta(title: string, description: string) {
  if (document.title !== title) document.title = title

  const metaDesc = setMetaTag('name', 'description')
  metaDesc.setAttribute('content', description)

  let canonical = document.querySelector('link[rel="canonical"]') as HTMLLinkElement | null
  if (!canonical) {
    canonical = document.createElement('link')
    canonical.setAttribute('rel', 'canonical')
    document.head.appendChild(canonical)
  }
  canonical.setAttribute('href', CANONICAL_BASE + '/')
}

export default function App() {
  const { configured, user, ready } = useAuth()

  useEffect(() => {
    if (!ready) {
      updatePageMeta('Loading — Gaptrace', '')
    } else if (configured && !user) {
      updatePageMeta(
        'Sign in — Gaptrace',
        'Sign in to Gaptrace to trace the gap between your acceptance criteria and code changes.',
      )
    }
  }, [ready, configured, user])

  if (!ready) return <main className="loading-page">Loading gaptrace…</main>
  if (configured && !user) return <AuthForm />
  return <Workspace />
}
