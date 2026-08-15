export interface Stat {
  /** Stable identity for the list; also the visible label. */
  label: string
  value: string | number
  tone?: 'full' | 'needs-review' | 'gap' | 'neutral'
}

interface StatGridProps {
  /** Names the group for assistive technology — the grid has no heading. */
  label: string
  stats: readonly Stat[]
}

/** Shared by the report header and the insights dashboard, so they can't drift. */
export function StatGrid({ label, stats }: StatGridProps) {
  return (
    <section className="summary" aria-label={label}>
      {stats.map((stat) => (
        <article key={stat.label}>
          <strong className={stat.tone ? `tone--${stat.tone}` : ''}>{stat.value}</strong>
          <span>{stat.label}</span>
        </article>
      ))}
    </section>
  )
}
