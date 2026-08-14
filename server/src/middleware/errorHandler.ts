import type { ErrorRequestHandler, RequestHandler } from 'express'
import { AppError } from '../lib/errors.js'
import { consoleLogger, describeError } from '../lib/logger.js'
import type { Logger } from '../lib/logger.js'

/**
 * The single error shape the client parses. One envelope for every failure,
 * so the frontend has exactly one branch: `if (!res.ok) show(body.error.message)`.
 */
export interface ErrorBody {
  error: {
    /** Stable, machine-readable: invalid_input | source_unavailable | upstream_error | not_found | internal_error */
    code: string
    /** Safe to show a user as-is. */
    message: string
  }
}

export const notFoundHandler: RequestHandler = (_req, res) => {
  const body: ErrorBody = { error: { code: 'not_found', message: 'No such endpoint.' } }
  res.status(404).json(body)
}

/**
 * Anything that isn't a deliberate `AppError` is a bug, so its message never
 * reaches the client — it could carry prompt or diff content. It's logged
 * server-side instead.
 */
export function createErrorHandler(logger: Logger = consoleLogger): ErrorRequestHandler {
  return (error, req, res, _next) => {
    // Express 5 can hand us an error after the response has begun; overwriting
    // the status then throws instead of producing a useful body.
    if (res.headersSent) {
      logger.error('errorHandler: failure after response started', {
        path: req.path,
        error: describeError(error),
      })
      res.end()
      return
    }

    if (error instanceof AppError) {
      // Upstream failures are ours to investigate; the 4xx family is the
      // caller's, and logging those is just noise.
      if (error.status >= 500) {
        logger.error('errorHandler: upstream failure', {
          path: req.path,
          code: error.code,
          error: describeError(error.cause ?? error),
        })
      }

      const body: ErrorBody = { error: { code: error.code, message: error.message } }
      res.status(error.status).json(body)
      return
    }

    // express.json() rejects malformed bodies with its own 400 before any
    // route runs — worth reporting as a client error rather than a crash.
    if (error instanceof SyntaxError && 'body' in error) {
      const body: ErrorBody = { error: { code: 'invalid_input', message: 'Malformed JSON body.' } }
      res.status(400).json(body)
      return
    }

    logger.error('errorHandler: unhandled error', {
      path: req.path,
      error: describeError(error),
    })
    const body: ErrorBody = {
      error: { code: 'internal_error', message: 'Something went wrong on our end.' },
    }
    res.status(500).json(body)
  }
}
