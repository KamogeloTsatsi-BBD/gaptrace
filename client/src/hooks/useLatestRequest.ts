import { useCallback, useEffect, useRef } from 'react'

/**
 * Keeps at most one in-flight request per hook, and cancels it on unmount.
 *
 * Without this, two overlapping submissions race and whichever *finishes* last
 * wins — which is not necessarily the one the user asked for last. `begin()`
 * aborts the previous attempt and hands back the signal for the new one, so
 * "last requested wins" holds regardless of how the network behaves.
 *
 * The controller lives in a ref, not in state: it changes on every request and
 * nothing renders from it, so subscribing to it would be pure re-render cost.
 */
export function useLatestRequest(): { begin: () => AbortSignal } {
  const controller = useRef<AbortController | null>(null)

  useEffect(() => () => controller.current?.abort(), [])

  const begin = useCallback(() => {
    controller.current?.abort()
    const next = new AbortController()
    controller.current = next
    return next.signal
  }, [])

  return { begin }
}
