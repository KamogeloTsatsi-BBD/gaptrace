import { useCallback, useState } from 'react'
import { createAnalysis } from '../lib/api/analyses'
import { ApiError, isAbortError, toMessage } from '../lib/api/httpClient'
import { useLatestRequest } from './useLatestRequest'
import type { CreateAnalysisRequest } from '../types/api'
import type { AnalysisReport } from '../types/domain'

export interface AnalysisFailure {
  message: string
  /** Stable server code, so the UI can offer the right recovery. */
  code: string
}

export interface AnalysisState {
  report: AnalysisReport | null
  submitting: boolean
  error: AnalysisFailure | null
}

const IDLE: AnalysisState = { report: null, submitting: false, error: null }

/**
 * Owns the running of one analysis: the request, its lifecycle, and the report
 * it produces. The form below it stays a controlled form and knows nothing
 * about the API; the page above it stays layout.
 *
 * The three fields move together and are never meaningfully independent — a
 * submitting run has no report and no error — so they are one state object
 * rather than three `useState` calls that can be left inconsistent between
 * renders.
 */
export function useAnalysis(accessToken?: string) {
  const [state, setState] = useState<AnalysisState>(IDLE)
  const { begin } = useLatestRequest()

  const submit = useCallback(
    async (body: CreateAnalysisRequest) => {
      const signal = begin()
      setState({ report: null, submitting: true, error: null })
      try {
        const report = await createAnalysis(body, { accessToken, signal })
        setState({ report, submitting: false, error: null })
      } catch (cause) {
        // A cancelled run was superseded by a newer one, which owns the state now.
        if (isAbortError(cause)) return
        setState({
          report: null,
          submitting: false,
          error: {
            message: toMessage(cause, 'The analysis could not be completed.'),
            code: cause instanceof ApiError ? cause.code : 'internal_error',
          },
        })
      }
    },
    [accessToken, begin],
  )

  const reset = useCallback(() => setState(IDLE), [])

  return { ...state, submit, reset }
}
