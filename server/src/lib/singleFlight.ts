/** The cache dedupes finished work; this dedupes work still running. */
export function createSingleFlight<T>(): (key: string, run: () => Promise<T>) => Promise<T> {
  const inFlight = new Map<string, Promise<T>>()

  return (key, run) => {
    const existing = inFlight.get(key)
    if (existing) return existing

    // Registered before the first await so a same-tick caller finds it, and
    // cleared in `finally` so a transient failure doesn't poison the key.
    const promise = (async () => run())().finally(() => {
      inFlight.delete(key)
    })

    inFlight.set(key, promise)
    return promise
  }
}
