/** The client branches on `code`; `message` is prose and may be reworded freely. */
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

/** Distinct from `invalid_input`: the fix is to paste the diff, not fix the URL. */
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

/** There is deliberately no 403: another user's analysis is absent, not forbidden. */
export class UnauthorizedError extends AppError {
  readonly status = 401
  readonly code = 'unauthorized'

  constructor(message = 'Sign in to continue.') {
    super(message)
    this.name = 'UnauthorizedError'
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
