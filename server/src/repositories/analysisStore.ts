/**
 * Persistence seam. Everything above this file talks to `AnalysisStore` and
 * never to a database client, so swapping the in-memory implementation for a
 * Supabase-backed one is a one-line change in the composition root — no route
 * or service is touched.
 */
import type { AnalysisReport } from '../types.js'

export interface AnalysisStore {
  save(report: AnalysisReport): Promise<void>
  findById(id: string): Promise<AnalysisReport | null>
  /** Newest first. Becomes a windowed, user-scoped query once auth lands. */
  list(limit: number): Promise<AnalysisReport[]>
}

/**
 * Process-local, non-durable: reports vanish on restart. That's the whole
 * point for now — the client can exercise the real request/response contract
 * before any schema is committed to.
 */
const MAX_RETAINED = 100

export function createInMemoryAnalysisStore(): AnalysisStore {
  // Insertion-ordered, so eviction is "drop the oldest key" and `list` is a
  // reverse walk. No timestamps involved, no clock skew to reason about.
  const reports = new Map<string, AnalysisReport>()

  return {
    async save(report) {
      reports.set(report.id, report)
      if (reports.size > MAX_RETAINED) {
        const oldest = reports.keys().next()
        if (!oldest.done) reports.delete(oldest.value)
      }
    },

    async findById(id) {
      return reports.get(id) ?? null
    },

    async list(limit) {
      return [...reports.values()].reverse().slice(0, limit)
    },
  }
}
