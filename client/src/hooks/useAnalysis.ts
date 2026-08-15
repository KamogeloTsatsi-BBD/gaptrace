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

/** One state object, not three: the fields move together and can't disagree. */
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

  /** Seeds a report on the demo path, without pretending a request happened. */
  const showReport = useCallback(
    (report: AnalysisReport) => setState({ report, submitting: false, error: null }),
    [],
  )

  return { ...state, submit, reset, showReport }
}
