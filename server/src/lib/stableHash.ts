import { createHash } from 'node:crypto'

/**
 * Canonical JSON: object keys sorted at every depth, so two values that are
 * equal as data serialise identically regardless of the order their fields
 * were assigned in. Arrays keep their order — for the substrate that order is
 * meaningful and already deterministic.
 *
 * Without this, adding a field to the substrate in a different position, or
 * building an object across two branches, would change the hash without
 * changing the data — and every dashboard fetch would bill for a fresh
 * narrative.
 */
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

/**
 * Content hash of a JSON-serialisable value. Used to decide whether a cached
 * AI result is still valid: same input, same answer, no reason to pay again.
 */
export function stableHash(value: unknown): string {
  return createHash('sha256').update(JSON.stringify(canonicalise(value))).digest('hex')
}
