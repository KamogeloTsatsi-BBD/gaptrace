import type { ReactNode, Ref } from 'react'

type NoticeTone = 'info' | 'error'

interface NoticeProps {
  tone: NoticeTone
  title: string
  children: ReactNode
  /** Optional recovery action, rendered beside the message. */
  action?: ReactNode
  /** So a caller can move focus here when the notice appears. */
  ref?: Ref<HTMLElement>
}

/** The one banner, so notices can't disagree about announcing themselves. */
export function Notice({ tone, title, children, action, ref }: NoticeProps) {
  return (
    <aside
      ref={ref}
      className={`notice notice--${tone}`}
      // Focusable programmatically, but never a tab stop of its own.
      tabIndex={-1}
      // Errors interrupt; informational banners are part of the page.
      role={tone === 'error' ? 'alert' : undefined}
    >
      <strong>{title}</strong>
      <span>{children}</span>
      {action}
    </aside>
  )
}
