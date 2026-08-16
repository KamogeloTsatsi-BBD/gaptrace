/** The seam. One implementation ships; the interface is what checkInsights stubs. */
import type { AuthContext } from '../lib/authContext.js'
import type { AnalysisReport } from '../types.js'

/** A report before it is stored: `id` and `createdAt` belong to the database. */
export type AnalysisDraft = Omit<AnalysisReport, 'id' | 'createdAt'>

export interface AnalysisStore {
  save(draft: AnalysisDraft): Promise<AnalysisReport>
  findById(id: number): Promise<AnalysisReport | null>
  /** Newest first, scoped to the caller by row-level security. */
  list(limit: number): Promise<AnalysisReport[]>
}

/** Request-scoped: the token a store carries is what resolves `auth.uid()`. */
export type AnalysisStoreFactory = (auth: AuthContext) => AnalysisStore
