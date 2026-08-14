/**
 * Collapses concurrent calls for the same key onto one in-flight promise.
 *
 * Without it, two dashboards hitting a cold cache at the same moment each see
 * a miss and each pay for an identical narration. The cache only dedupes work
 * that has already finished; this dedupes work still running.
 */
export function createSingleFlight<T>(): (key: string, run: () => Promise<T>) => Promise<T> {
  const inFlight = new Map<string, Promise<T>>()

  return (key, run) => {
    const existing = inFlight.get(key)
    if (existing) return existing

    // Registered before the first await so a caller arriving in the same tick
    // finds it. Cleared in `finally` so a failure doesn't poison the key —
    // otherwise one transient API error would be replayed to every later
    // caller for the life of the process.
    const promise = (async () => run())().finally(() => {
      inFlight.delete(key)
    })

    inFlight.set(key, promise)
    return promise
  }
}
