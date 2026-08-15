import type { ErrorRequestHandler, RequestHandler } from 'express'
import { AppError } from '../lib/errors.js'
import { consoleLogger, describeError } from '../lib/logger.js'
import type { Logger } from '../lib/logger.js'

/** The single error shape the client parses, for every failure. */
export interface ErrorBody {
  error: {
    /** invalid_input | unauthorized | source_unavailable | upstream_error | not_found | internal_error */
    code: string
    /** Safe to show a user as-is. */
    message: string
  }
}

export const notFoundHandler: RequestHandler = (_req, res) => {
  const body: ErrorBody = { error: { code: 'not_found', message: 'No such endpoint.' } }
  res.status(404).json(body)
}

/** A non-`AppError` message is logged, never returned: it can carry prompt content. */
export function createErrorHandler(logger: Logger = consoleLogger): ErrorRequestHandler {
  return (error, req, res, _next) => {
    // Express 5 can hand us an error after the response has begun, and
    // overwriting the status then throws.
    if (res.headersSent) {
      logger.error('errorHandler: failure after response started', {
        path: req.path,
        error: describeError(error),
      })
      res.end()
      return
    }

    if (error instanceof AppError) {
      // Only 5xx is ours to investigate; logging the 4xx family is noise.
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

    // express.json() rejects malformed bodies before any route runs.
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
