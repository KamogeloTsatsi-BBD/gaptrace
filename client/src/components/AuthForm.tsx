import { useState, type FormEvent } from 'react';
import { useAuth } from '../auth/AuthContext';

export function AuthForm({ preview = false }: { preview?: boolean }) {
  const { configured, signIn, signUp } = useAuth();
  const [mode, setMode] = useState<'signIn' | 'signUp'>('signIn');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setSubmitting(true); setMessage('');
    if (preview || !configured) {
      setMessage('Login is a visual preview until Supabase is configured.');
      setSubmitting(false);
      return;
    }
    const data = new FormData(event.currentTarget);
    const action = mode === 'signIn' ? signIn : signUp;
    const { error } = await action(String(data.get('email')), String(data.get('password')));
    setMessage(error?.message ?? (mode === 'signUp' ? 'Check your email to confirm your account.' : ''));
    setSubmitting(false);
  }

  return <main className="auth-page"><section className="auth-introduction" aria-labelledby="auth-title"><p className="eyebrow">Evidence-led delivery checks</p><h1 id="auth-title">Know what shipped.</h1><p>Compare every acceptance criterion with a pull-request diff, and keep the evidence close to the verdict.</p></section><section className="auth-card" aria-labelledby="auth-form-title"><h2 id="auth-form-title">{mode === 'signIn' ? 'Welcome back' : 'Create your account'}</h2>{preview && <p className="field-help">Design preview — authentication is not connected.</p>}<form onSubmit={handleSubmit}><label>Email<input name="email" type="email" autoComplete="email" required /></label><label>Password<input name="password" type="password" autoComplete={mode === 'signIn' ? 'current-password' : 'new-password'} minLength={6} required /></label>{message && <p className="form-message" role="status">{message}</p>}<button type="submit" disabled={submitting}>{submitting ? 'Please wait…' : mode === 'signIn' ? 'Sign in' : 'Create account'}</button></form><p>{mode === 'signIn' ? 'New to gaptrace?' : 'Already have an account?'} <button className="text-button" type="button" onClick={() => setMode(mode === 'signIn' ? 'signUp' : 'signIn')}>{mode === 'signIn' ? 'Create an account' : 'Sign in'}</button></p></section></main>;
}
