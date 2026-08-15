import { createHash } from 'node:crypto'

/** Keys sorted at every depth; arrays keep their order, which is meaningful here. */
function canonicalise(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(canonicalise)

  if (value !== null && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>)
        .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))
        .map(([key, entry]) => [key, canonicalise(entry)]),
    )
  }

  return value
}

/** Content hash deciding whether a cached AI result is still valid. */
export function stableHash(value: unknown): string {
  return createHash('sha256').update(JSON.stringify(canonicalise(value))).digest('hex')
}
