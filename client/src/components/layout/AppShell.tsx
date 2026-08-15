import type { ReactNode } from 'react'
import { useAuth } from '../../auth/useAuth'

export type AppPage = 'analysis' | 'insights'

interface NavItem {
  page: AppPage
  label: string
}

// Hoisted: a literal array rebuilt on every render is a new prop identity for
// no reason, and this one never varies.
const NAV_ITEMS: readonly NavItem[] = [
  { page: 'analysis', label: 'New analysis' },
  { page: 'insights', label: 'Insights' },
]

interface AppShellProps {
  page: AppPage
  onNavigate: (page: AppPage) => void
  children: ReactNode
}

export function AppShell({ page, onNavigate, children }: AppShellProps) {
  const { user, signOut, configured } = useAuth()

  return (
    <>
      <header className="site-header">
        {/* Buttons, not anchors. These switch a view rather than navigate to a
            document, and the previous anchors pointed at fragments that did
            not exist and had their default prevented — a link that goes
            nowhere is one a keyboard or screen-reader user is misled by. */}
        <button className="brand" type="button" onClick={() => onNavigate('analysis')}>
          gaptrace
        </button>

        <nav aria-label="Primary navigation">
          {NAV_ITEMS.map((item) => (
            <button
              key={item.page}
              type="button"
              className={item.page === page ? 'nav-link active' : 'nav-link'}
              aria-current={item.page === page ? 'page' : undefined}
              onClick={() => onNavigate(item.page)}
            >
              {item.label}
            </button>
          ))}
        </nav>

        <section className="account" aria-label="Account controls">
          {user ? <span>{user.email}</span> : null}
          {configured ? (
            <button className="quiet-button" type="button" onClick={() => void signOut()}>
              Sign out
            </button>
          ) : null}
        </section>
      </header>

      <main className="page-content">{children}</main>
    </>
  )
}
