export interface Stat {
  /** Stable identity for the list; also the visible label. */
  label: string
  value: string | number
}

interface StatGridProps {
  /** Names the group for assistive technology — the grid has no heading. */
  label: string
  stats: readonly Stat[]
}

/**
 * The figure row used by both the report header and the insights dashboard.
 * One component so the two cannot drift apart visually, and so a change to
 * how a figure is announced happens once.
 */
export function StatGrid({ label, stats }: StatGridProps) {
  return (
    <section className="summary" aria-label={label}>
      {stats.map((stat) => (
        <article key={stat.label}>
          <strong>{stat.value}</strong>
          <span>{stat.label}</span>
        </article>
      ))}
    </section>
  )
}
