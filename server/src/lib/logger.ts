/**
 * Minimal logging seam. Services depend on this interface, not on `console`,
 * so a real logger can be dropped in without touching them.
 */
export interface Logger {
  warn(message: string, context?: Record<string, unknown>): void
  error(message: string, context?: Record<string, unknown>): void
}

export const consoleLogger: Logger = {
  warn: (message, context) => console.warn(message, context ?? {}),
  error: (message, context) => console.error(message, context ?? {}),
}

/**
 * Summarise an error for logging without serialising the whole object.
 * SDK errors carry the originating request, so logging them raw would put
 * prompt and diff content into stdout.
 */
export function describeError(error: unknown): string {
  if (error instanceof Error) {
    const { status } = error as { status?: number }
    const label = status === undefined ? error.name : `${error.name} (HTTP ${status})`
    return `${label}: ${error.message}`
  }
  return 'Unknown error'
}
