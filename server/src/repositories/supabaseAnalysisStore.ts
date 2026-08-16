/** No query filters on `user_id`: RLS does it, and nothing here can bypass that. */
import {
  ANALYSIS_SELECT,
  CRITERION_SELECT,
  toReport,
  type AnalysisRow,
  type CriterionRow,
} from './analysisMapper.js'
import { createUserClient } from '../lib/supabaseClient.js'
import type { AuthContext } from '../lib/authContext.js'
import type { AnalysisDraft, AnalysisStore } from './analysisStore.js'
import type { PostgrestError } from '@supabase/supabase-js'

/** Plain `Error`, not `AppError`: a PostgREST message can quote the offending row. */
function fail(operation: string, error: PostgrestError): never {
  throw new Error(`${operation} failed: ${error.message}`, { cause: error })
}

export function createSupabaseAnalysisStore(auth: AuthContext): AnalysisStore {
  const db = createUserClient(auth.accessToken)

  // A second request, not a PostgREST embed: the parent link is a composite FK,
  // and relationship detection through one is fragile to depend on.
  const criteriaFor = async (analysisIds: number[]): Promise<Map<number, CriterionRow[]>> => {
    const byAnalysis = new Map<number, CriterionRow[]>()
    if (analysisIds.length === 0) return byAnalysis

    const { data, error } = await db
      .from('criteria')
      .select(CRITERION_SELECT)
      .in('analysis_id', analysisIds)

    if (error) fail('Loading criteria', error)

    for (const row of (data ?? []) as unknown as CriterionRow[]) {
      const existing = byAnalysis.get(row.analysis_id)
      if (existing) existing.push(row)
      else byAnalysis.set(row.analysis_id, [row])
    }
    return byAnalysis
  }

  return {
    async save(draft: AnalysisDraft) {
      // One call, one transaction. A half-written report would read as an
      // analysis that legitimately found nothing.
      const { data, error } = await db.rpc('save_analysis', { draft })
      if (error) fail('Saving the analysis', error)

      const [saved] = (data ?? []) as { id: number; created_at: string }[]
      if (!saved) throw new Error('save_analysis returned no row.')

      // Composed rather than re-read: the draft is the whole report bar the
      // two fields the database owns.
      return {
        ...draft,
        id: saved.id,
        createdAt: new Date(saved.created_at).toISOString(),
      }
    },

    async findById(id: number) {
      const { data, error } = await db
        .from('analyses')
        .select(ANALYSIS_SELECT)
        .eq('id', id)
        .maybeSingle()

      if (error) fail('Loading the analysis', error)
      if (!data) return null

      const row = data as unknown as AnalysisRow
      const criteria = await criteriaFor([row.id])
      return toReport(row, criteria.get(row.id) ?? [])
    },

    async list(limit: number) {
      // `id desc`, not `created_at desc`: monotonic, so no tie-break, and it
      // matches the index.
      const { data, error } = await db
        .from('analyses')
        .select(ANALYSIS_SELECT)
        .order('id', { ascending: false })
        .limit(limit)

      if (error) fail('Loading analyses', error)

      const rows = (data ?? []) as unknown as AnalysisRow[]
      const criteria = await criteriaFor(rows.map((row) => row.id))
      return rows.map((row) => toReport(row, criteria.get(row.id) ?? []))
    },
  }
}
