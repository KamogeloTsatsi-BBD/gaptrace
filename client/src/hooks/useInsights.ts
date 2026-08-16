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

/** `load` is free and repeatable; `generate` bills, so it fires only from a gesture. */
export function useInsights(accessToken?: string) {
  const [state, setState] = useState<InsightsState>(IDLE)
  const { begin } = useLatestRequest()
  // A ref, not state: read only inside callbacks, so `load` stays stable.
  const loaded = useRef(false)

  const load = useCallback(
    async (options: { force?: boolean } = {}) => {
      if (loaded.current && !options.force) return

      const signal = begin()
      setState((previous) => ({ ...previous, loading: true, error: '' }))
      try {
        const data = await getInsights({ accessToken, signal })
        // Set on success, not on dispatch: under StrictMode the remount aborts
        // the first fetch, and a flag set early makes the re-run skip, leaving
        // `loading` true forever. Refetching is free, so a late guard is safe.
        loaded.current = true
        setState((previous) => ({ ...previous, data, loading: false, error: '' }))
      } catch (cause) {
        // A superseding request owns `loading` from here — see useLatestRequest.
        if (isAbortError(cause)) return
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
      // Not abortable: the server bills the moment the call starts, so
      // cancelling only discards something already paid for.
      const { narrative } = await generateNarrative({ accessToken })
      setState((previous) => ({
        ...previous,
        generating: false,
        // stale: false retires the regenerate button until the numbers move.
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

  return { ...state, load, generate }
}
