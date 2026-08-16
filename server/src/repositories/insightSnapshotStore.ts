/** Keyed on a content hash, not a TTL — a timer expires work that is still valid. */
import type { AuthContext } from '../lib/authContext.js'
import type { InsightSnapshot } from '../types.js'

export interface InsightSnapshotStore {
  /** The snapshot for this exact substrate, or null if the data has moved on. */
  get(key: string): Promise<InsightSnapshot | null>
  save(snapshot: InsightSnapshot): Promise<void>
}

/** Request-scoped for the same reason as `AnalysisStoreFactory`. */
export type InsightSnapshotStoreFactory = (auth: AuthContext) => InsightSnapshotStore
