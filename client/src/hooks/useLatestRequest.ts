import { useCallback, useEffect, useRef } from 'react'

/**
 * One in-flight request per hook, cancelled on unmount. Without it, whichever
 * of two overlapping submissions *finishes* last wins.
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
