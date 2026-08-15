/** Services depend on this rather than on `console`. */
export interface Logger {
  warn(message: string, context?: Record<string, unknown>): void
  error(message: string, context?: Record<string, unknown>): void
}

export const consoleLogger: Logger = {
  warn: (message, context) => console.warn(message, context ?? {}),
  error: (message, context) => console.error(message, context ?? {}),
}

/** Summarises, never serialises: an SDK error carries the prompt and diff. */
export function describeError(error: unknown): string {
  if (error instanceof Error) {
    const { status } = error as { status?: number }
    const label = status === undefined ? error.name : `${error.name} (HTTP ${status})`
    return `${label}: ${error.message}`
  }
  return 'Unknown error'
}
