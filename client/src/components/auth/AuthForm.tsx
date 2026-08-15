import { useState, type FormEvent } from 'react'
import { useAuth } from '../../auth/useAuth'

type Mode = 'signIn' | 'signUp'

interface FormMessage {
  text: string
  tone: 'error' | 'status'
}

/**
 * The fields are uncontrolled and read from `FormData` on submit. Nothing
 * derives from a half-typed password, so holding it in state would re-render
 * the form on every keystroke to display a value the DOM already has.
 */
export function AuthForm({ preview = false }: { preview?: boolean }) {
  const { configured, signIn, signUp } = useAuth()
  const [mode, setMode] = useState<Mode>('signIn')
  const [message, setMessage] = useState<FormMessage | null>(null)
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    // Read before the first await: React pools nothing here, but
    // `currentTarget` is null by the time an async continuation resumes.
    const fields = new FormData(event.currentTarget)

    if (preview || !configured) {
      setMessage({
        text: 'Login is a visual preview until Supabase is configured.',
        tone: 'status',
      })
      return
    }

    setSubmitting(true)
    setMessage(null)
    const submit = mode === 'signIn' ? signIn : signUp
    const { error } = await submit(String(fields.get('email')), String(fields.get('password')))
    setSubmitting(false)

    if (error) {
      setMessage({ text: error.message, tone: 'error' })
      return
    }
    // A successful sign-in swaps this whole view out; only sign-up has
    // something left to say.
    setMessage(
      mode === 'signUp'
        ? { text: 'Check your email to confirm your account.', tone: 'status' }
        : null,
    )
  }

  const isSignIn = mode === 'signIn'

  return (
    <main className="auth-page">
      <section className="auth-introduction" aria-labelledby="auth-title">
        <p className="eyebrow">Evidence-led delivery checks</p>
        <h1 id="auth-title">Know what shipped.</h1>
        <p>
          Compare every acceptance criterion with a pull-request diff, and keep the evidence
          close to the verdict.
        </p>
      </section>

      <section className="auth-card" aria-labelledby="auth-form-title">
        <h2 id="auth-form-title">{isSignIn ? 'Welcome back' : 'Create your account'}</h2>
        {preview ? (
          <p className="field-help">Design preview — authentication is not connected.</p>
        ) : null}

        <form onSubmit={handleSubmit}>
          <section className="field">
            <label htmlFor="auth-email">Email</label>
            <input id="auth-email" name="email" type="email" autoComplete="email" required />
          </section>

          <section className="field">
            <label htmlFor="auth-password">Password</label>
            <input
              id="auth-password"
              name="password"
              type="password"
              autoComplete={isSignIn ? 'current-password' : 'new-password'}
              minLength={6}
              required
            />
          </section>

          {message ? (
            <p
              className={`form-message form-message--${message.tone}`}
              role={message.tone === 'error' ? 'alert' : 'status'}
            >
              {message.text}
            </p>
          ) : null}

          <button type="submit" disabled={submitting}>
            {submitting ? 'Please wait…' : isSignIn ? 'Sign in' : 'Create account'}
          </button>
        </form>

        <p>
          {isSignIn ? 'New to gaptrace?' : 'Already have an account?'}{' '}
          <button
            className="text-button"
            type="button"
            onClick={() => setMode(isSignIn ? 'signUp' : 'signIn')}
          >
            {isSignIn ? 'Create an account' : 'Sign in'}
          </button>
        </p>
      </section>
    </main>
  )
}
