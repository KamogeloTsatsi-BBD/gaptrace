import { AuthForm } from './components/auth/AuthForm'
import { Workspace } from './pages/Workspace'
import { useAuth } from './auth/useAuth'

/** The only routing decision in the app: splash, then auth or workspace. */
export default function App() {
  const { configured, user, ready } = useAuth()

  if (!ready) return <main className="loading-page">Loading gaptrace…</main>
  if (configured && !user) return <AuthForm />
  return <Workspace />
}
