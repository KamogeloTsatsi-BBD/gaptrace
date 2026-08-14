/**
 * Orchestrates the run: resolve source -> parse -> compare -> summarise.
 *
 * Deliberately thin. It owns sequencing and error translation only; each step
 * it calls is independently testable and knows nothing about HTTP.
 */
import { randomUUID } from 'node:crypto'
import { AppError, UpstreamError } from '../lib/errors.js'
import { summariseCriteria } from '../lib/reportStats.js'
import { computeScopeSignal } from '../lib/scopeSignal.js'
import { resolveCodeSource } from '../sources/codeSource.js'
import type { CodeSourceInput } from '../sources/codeSource.js'
import { compareAll } from './groundedComparator.js'
import { parseRequirement } from './requirementParser.js'
import type { AnalysisReport } from '../types.js'

export interface AnalysisRequest {
  requirementText: string
  code: CodeSourceInput
}

/**
 * The AI steps throw whatever the SDK threw — a rate limit, a timeout, a
 * malformed-output error. None of that is the caller's fault or the caller's
 * business, so it collapses into one upstream failure with the original
 * attached as `cause` for the logs.
 *
 * `AppError`s pass through untouched: those are our own deliberate, already
 * user-facing failures.
 */
async function step<T>(label: string, run: () => Promise<T>): Promise<T> {
  try {
    return await run()
  } catch (error) {
    if (error instanceof AppError) throw error
    throw new UpstreamError(`The analysis failed during ${label}. Try again.`, { cause: error })
  }
}

/**
 * @throws {InvalidInputError} on empty/oversized input or an unrecognised PR URL.
 * @throws {SourceUnavailableError} when a linked diff can't be fetched.
 * @throws {UpstreamError} when a model call fails outright.
 */
export async function runAnalysis(request: AnalysisRequest): Promise<AnalysisReport> {
  const { diffText, prReference } = await resolveCodeSource(request.code)

  // Parse first: it's the cheap call, and it's the one that rejects a
  // requirement yielding more criteria than we're willing to bill for. Doing
  // it before the fan-out means a bad requirement costs one call, not fifty.
  const criteria = await step('requirement parsing', () =>
    parseRequirement(request.requirementText),
  )

  const evaluated = await step('diff comparison', () => compareAll(criteria, diffText))

  return {
    id: randomUUID(),
    createdAt: new Date().toISOString(),
    requirementText: request.requirementText.trim(),
    prReference,
    summary: summariseCriteria(evaluated),
    // Derived from the evidence just produced, so the opposite direction —
    // what changed that nobody asked for — costs no extra call.
    scope: computeScopeSignal(diffText, evaluated),
    criteria: evaluated,
  }
}
