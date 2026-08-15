import { CATEGORY_LABELS, formatRate } from '../../lib/format'
import type { CategoryStat } from '../../types/domain'

/** Renders recurrence beside volume: ten gaps in one PR is not ten across ten. */
export function CategoryBreakdown({ categories }: { categories: readonly CategoryStat[] }) {
  if (categories.length === 0) return null

  return (
    <section className="category-breakdown" aria-labelledby="category-title">
      <h2 id="category-title">Gap categories</h2>
      <ol>
        {categories.map((stat) => (
          <li key={stat.category}>
            <span>{CATEGORY_LABELS[stat.category]}</span>
            <strong>
              {stat.count} {stat.count === 1 ? 'gap' : 'gaps'} · {formatRate(stat.rate)} of
              criteria · in {stat.analyses}{' '}
              {stat.analyses === 1 ? 'analysis' : 'analyses'}
            </strong>
          </li>
        ))}
      </ol>
    </section>
  )
}
