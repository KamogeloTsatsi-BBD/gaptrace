import type { ReactNode } from 'react'

type NoticeTone = 'info' | 'error'

interface NoticeProps {
  tone: NoticeTone
  title: string
  children: ReactNode
  /** Optional recovery action, rendered beside the message. */
  action?: ReactNode
}

/**
 * The one banner. Previously each caller hand-rolled its own `<aside>` with a
 * bespoke class, which is how two notices end up disagreeing about whether
 * they announce themselves to a screen reader.
 */
export function Notice({ tone, title, children, action }: NoticeProps) {
  return (
    <aside
      className={`notice notice--${tone}`}
      // Errors interrupt; informational banners are part of the page.
      role={tone === 'error' ? 'alert' : undefined}
    >
      <strong>{title}</strong>
      <span>{children}</span>
      {action}
    </aside>
  )
}
