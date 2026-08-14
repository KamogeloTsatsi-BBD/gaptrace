/**
 * Map over items with a bounded number of in-flight promises, preserving
 * input order in the result.
 *
 * On failure, no further items are scheduled, but every worker already in
 * flight is awaited before the first error is rethrown — so the caller never
 * leaves dangling promises behind.
 */
export async function mapWithLimit<T, R>(
  items: readonly T[],
  limit: number,
  fn: (item: T, index: number) => Promise<R>,
): Promise<R[]> {
  if (!Number.isInteger(limit) || limit < 1) {
    throw new RangeError(`mapWithLimit: limit must be a positive integer, got ${limit}`)
  }
  if (items.length === 0) return []

  const results = new Array<R>(items.length)
  let next = 0
  let failure: unknown
  let failed = false

  const worker = async (): Promise<void> => {
    while (next < items.length) {
      const index = next++
      try {
        results[index] = await fn(items[index], index)
      } catch (error) {
        if (!failed) {
          failed = true
          failure = error
        }
        // Stop handing out work; in-flight workers still drain.
        next = items.length
      }
    }
  }

  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, worker))

  if (failed) throw failure
  return results
}
