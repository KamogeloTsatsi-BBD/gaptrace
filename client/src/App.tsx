import { AuthForm } from './components/auth/AuthForm'
import { Workspace } from './pages/Workspace'
import { useAuth } from './auth/useAuth'

// Read once at module load. The query string cannot change without a full page
// load, so re-parsing it on every render only allocates.
const IS_LOGIN_PREVIEW = new URLSearchParams(window.location.search).has('preview-login')

/**
 * The only routing decision in the app: splash while the session resolves,
 * then either the sign-in form or the workspace. Everything below this is
 * either a page or a component, never both.
 */
export default function App() {
  const { configured, user, ready } = useAuth()

  if (IS_LOGIN_PREVIEW) return <AuthForm preview />
  if (!ready) return <main className="loading-page">Loading gaptrace…</main>
  if (configured && !user) return <AuthForm />
  return <Workspace />
}
