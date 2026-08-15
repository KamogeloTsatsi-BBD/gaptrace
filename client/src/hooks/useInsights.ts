import { useCallback, useRef, useState } from 'react'
import { generateNarrative, getInsights } from '../lib/api/insights'
import { isAbortError, toMessage } from '../lib/api/httpClient'
import { useLatestRequest } from './useLatestRequest'
import type { InsightsResponse } from '../types/api'

export interface InsightsState {
  data: InsightsResponse | null
  loading: boolean
  error: string
  /** Separate from `loading`: the dashboard stays readable while narrating. */
  generating: boolean
  generateError: string
}

const IDLE: InsightsState = {
  data: null,
  loading: false,
  error: '',
  generating: false,
  generateError: '',
}

/**
 * Owns the insights dashboard's two very different calls.
 *
 * `load` is free — pure counting server-side — so it runs on demand and is
 * safe to repeat. `generate` is the only call in the client that can cost
 * money, so it is reachable exclusively from a user gesture and refuses to
 * fire when the substrate has not moved: the server would hand back the same
 * cached narrative, and asking for it again is a round trip that cannot change
 * the answer.
 */
export function useInsights(accessToken?: string) {
  const [state, setState] = useState<InsightsState>(IDLE)
  const { begin } = useLatestRequest()
  // Read only inside callbacks, never rendered — a ref keeps `load` stable so
  // it does not re-arm the callers that depend on it.
  const loaded = useRef(false)

  const load = useCallback(
    async (options: { force?: boolean } = {}) => {
      if (loaded.current && !options.force) return
      loaded.current = true

      const signal = begin()
      setState((previous) => ({ ...previous, loading: true, error: '' }))
      try {
        const data = await getInsights({ accessToken, signal })
        setState((previous) => ({ ...previous, data, loading: false, error: '' }))
      } catch (cause) {
        if (isAbortError(cause)) return
        loaded.current = false
        setState((previous) => ({
          ...previous,
          loading: false,
          error: toMessage(cause, 'Insights could not be loaded.'),
        }))
      }
    },
    [accessToken, begin],
  )

  const generate = useCallback(async () => {
    setState((previous) => ({ ...previous, generating: true, generateError: '' }))
    try {
      // Deliberately not abortable. The server bills the moment the call
      // starts, so cancelling the response only throws away something already
      // paid for — and the snapshot is cached server-side either way.
      const { narrative } = await generateNarrative({ accessToken })
      setState((previous) => ({
        ...previous,
        generating: false,
        // The narrative now matches the substrate it was generated from, so
        // the regenerate affordance retires until the numbers move again.
        data: previous.data ? { ...previous.data, narrative, stale: false } : previous.data,
      }))
    } catch (cause) {
      if (isAbortError(cause)) return
      setState((previous) => ({
        ...previous,
        generating: false,
        generateError: toMessage(cause, 'The narrative could not be generated.'),
      }))
    }
  }, [accessToken])

  /** Seeds the dashboard for the unconfigured demo path. */
  const showExample = useCallback(
    (data: InsightsResponse) => {
      loaded.current = true
      setState({ ...IDLE, data })
    },
    [],
  )

  return { ...state, load, generate, showExample }
}
