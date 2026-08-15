/** Sequencing and error translation only: resolve -> parse -> compare -> summarise. */
import { AppError, UpstreamError } from '../lib/errors.js'
import { summariseCriteria } from '../lib/reportStats.js'
import { computeScopeSignal } from '../lib/scopeSignal.js'
import { resolveCodeSource } from '../sources/codeSource.js'
import type { CodeSourceInput } from '../sources/codeSource.js'
import { compareAll } from './groundedComparator.js'
import { parseRequirement } from './requirementParser.js'
import type { AnalysisDraft } from '../repositories/analysisStore.js'

export interface AnalysisRequest {
  requirementText: string
  code: CodeSourceInput
}

/** Collapses SDK failures into one `UpstreamError`; `AppError`s pass through. */
async function step<T>(label: string, run: () => Promise<T>): Promise<T> {
  try {
    return await run()
  } catch (error) {
    if (error instanceof AppError) throw error
    throw new UpstreamError(`The analysis failed during ${label}. Try again.`, { cause: error })
  }
}

export async function runAnalysis(request: AnalysisRequest): Promise<AnalysisDraft> {
  const { diffText, prReference } = await resolveCodeSource(request.code)

  // Parsed before the fan-out, so a bad requirement costs one call, not fifty.
  const criteria = await step('requirement parsing', () =>
    parseRequirement(request.requirementText),
  )

  const evaluated = await step('diff comparison', () => compareAll(criteria, diffText))

  // A draft: no `id` or `createdAt`, both of which belong to the database.
  return {
    requirementText: request.requirementText.trim(),
    prReference,
    summary: summariseCriteria(evaluated),
    // Derived from the evidence just produced, so it costs no extra call.
    scope: computeScopeSignal(diffText, evaluated),
    criteria: evaluated,
  }
}
