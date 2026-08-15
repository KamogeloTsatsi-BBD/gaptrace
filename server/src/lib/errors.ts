/**
 * Errors the HTTP layer knows how to turn into a response.
 *
 * `code` is the stable, machine-readable half of the contract — the client
 * branches on it; `message` is prose meant to be shown to a person and may be
 * reworded freely.
 */
export abstract class AppError extends Error {
  abstract readonly status: number
  abstract readonly code: string
}

/** The request was well-formed JSON but the values can't be worked with. */
export class InvalidInputError extends AppError {
  readonly status = 400
  readonly code = 'invalid_input'

  constructor(message: string) {
    super(message)
    this.name = 'InvalidInputError'
  }
}

/**
 * A PR link was valid in shape but the diff couldn't be fetched — private,
 * deleted, oversized, or the host was unreachable. Distinct from
 * `invalid_input` because the fix is different: the user pastes the diff
 * instead of correcting the URL.
 */
export class SourceUnavailableError extends AppError {
  readonly status = 422
  readonly code = 'source_unavailable'

  constructor(message: string) {
    super(message)
    this.name = 'SourceUnavailableError'
  }
}

/** The model call failed outright, so there is no report to return. */
export class UpstreamError extends AppError {
  readonly status = 502
  readonly code = 'upstream_error'

  constructor(message: string, options?: { cause?: unknown }) {
    super(message, options)
    this.name = 'UpstreamError'
  }
}

export class NotFoundError extends AppError {
  readonly status = 404
  readonly code = 'not_found'

  constructor(message: string) {
    super(message)
    this.name = 'NotFoundError'
  }
}
