/**
 * Cache for generated narratives, keyed on a hash of the substrate they were
 * generated from.
 *
 * The whole point is that identical input never costs twice. A time-based TTL
 * would be the wrong tool: it expires work that is still perfectly valid and
 * spends money on a timer. A content hash costs nothing while nothing moves,
 * and invalidates the instant something does.
 */
import type { InsightSnapshot } from '../types.js'

export interface InsightSnapshotStore {
  /** The snapshot for this exact substrate, or null if the data has moved on. */
  get(key: string): Promise<InsightSnapshot | null>
  save(snapshot: InsightSnapshot): Promise<void>
}

/**
 * One slot, not an LRU. Older narratives describe data nobody is looking at
 * any more; keeping them would only add eviction rules to no benefit.
 *
 * Becomes an `insight_snapshots` row keyed on the hash once Supabase lands —
 * at which point the cache also survives restarts and is shared across
 * instances, which is where it starts saving real money.
 */
export function createInMemoryInsightSnapshotStore(): InsightSnapshotStore {
  let current: InsightSnapshot | null = null

  return {
    async get(key) {
      return current?.key === key ? current : null
    },

    async save(snapshot) {
      current = snapshot
    },
  }
}
