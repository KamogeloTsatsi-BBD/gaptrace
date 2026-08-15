import { AuthForm } from './components/auth/AuthForm'
import { Workspace } from './pages/Workspace'
import { useAuth } from './auth/useAuth'

/**
 * The only routing decision in the app: splash while the session resolves,
 * then either the sign-in form or the workspace. Everything below this is
 * either a page or a component, never both.
 */
export default function App() {
  const { configured, user, ready } = useAuth()

  if (!ready) return <main className="loading-page">Loading gaptrace…</main>
  if (configured && !user) return <AuthForm />
  return <Workspace />
}
