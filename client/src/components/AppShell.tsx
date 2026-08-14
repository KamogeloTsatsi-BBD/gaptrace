import type { ReactNode } from 'react';
import { useAuth } from '../auth/AuthContext';

interface AppShellProps { page: 'analysis' | 'insights'; onNavigate: (page: 'analysis' | 'insights') => void; children: ReactNode; }

export function AppShell({ page, onNavigate, children }: AppShellProps) {
  const { session, signOut } = useAuth();
  return <><header className="site-header"><a className="brand" href="#new-analysis" onClick={(event) => { event.preventDefault(); onNavigate('analysis'); }}>gaptrace</a><nav aria-label="Primary navigation"><a className={page === 'analysis' ? 'active' : ''} href="#new-analysis" onClick={(event) => { event.preventDefault(); onNavigate('analysis'); }}>New analysis</a><a className={page === 'insights' ? 'active' : ''} href="#insights" onClick={(event) => { event.preventDefault(); onNavigate('insights'); }}>Insights</a></nav><section className="account" aria-label="Account controls"><span>{session?.user.email}</span><button className="quiet-button" type="button" onClick={() => void signOut()}>Sign out</button></section></header><main className="page-content">{children}</main></>;
}
