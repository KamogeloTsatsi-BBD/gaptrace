import { AuthForm } from './components/auth/AuthForm'
import { Workspace } from './pages/Workspace'
import { useAuth } from './auth/useAuth'

// Read once: the query string cannot change without a full page load.
const IS_LOGIN_PREVIEW = new URLSearchParams(window.location.search).has('preview-login')

/** The only routing decision in the app: splash, then auth or workspace. */
export default function App() {
  const { configured, user, ready } = useAuth()

  if (IS_LOGIN_PREVIEW) return <AuthForm preview />
  if (!ready) return <main className="loading-page">Loading gaptrace…</main>
  if (configured && !user) return <AuthForm />
  return <Workspace />
}
