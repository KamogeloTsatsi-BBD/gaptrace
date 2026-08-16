/** One row per user, overwritten: a superseded narrative can never match again. */
import { createUserClient } from '../lib/supabaseClient.js'
import type { AuthContext } from '../lib/authContext.js'
import type { InsightSnapshot } from '../types.js'
import type { InsightSnapshotStore } from './insightSnapshotStore.js'

interface SnapshotRow {
  substrate_key: string
  cards: unknown
  generated_at: string
  analysis_count: number
}

export function createSupabaseInsightSnapshotStore(auth: AuthContext): InsightSnapshotStore {
  const db = createUserClient(auth.accessToken)

  return {
    async get(key: string) {
      const { data, error } = await db
        .from('insight_snapshots')
        .select('substrate_key, cards, generated_at, analysis_count')
        .eq('substrate_key', key)
        .maybeSingle()

      // A cache read is not worth failing a request over; absent is a correct
      // fallback, and it never spends money on its own.
      if (error || !data) return null

      const row = data as unknown as SnapshotRow
      return {
        key: row.substrate_key,
        cards: row.cards as InsightSnapshot['cards'],
        generatedAt: new Date(row.generated_at).toISOString(),
        analysisCount: row.analysis_count,
      }
    },

    async save(snapshot: InsightSnapshot) {
      // `user_id` comes from the token verified at the gate, never a lookup —
      // that would put a network call on the write path.
      const { error } = await db.from('insight_snapshots').upsert(
        {
          user_id: auth.userId,
          substrate_key: snapshot.key,
          cards: snapshot.cards,
          generated_at: snapshot.generatedAt,
          analysis_count: snapshot.analysisCount,
        },
        { onConflict: 'user_id' },
      )

      if (error) {
        throw new Error(`Saving the insight snapshot failed: ${error.message}`, { cause: error })
      }
    },
  }
}
