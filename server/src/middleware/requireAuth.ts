/** Verification is local: `getClaims` checks the signature against cached JWKS. */
import { UnauthorizedError } from '../lib/errors.js'
import { getVerifierClient } from '../lib/supabaseClient.js'
import type { AuthContext } from '../lib/authContext.js'
import type { RequestHandler } from 'express'

export type { AuthContext }

declare module 'express-serve-static-core' {
  interface Request {
    auth?: AuthContext
  }
}

function bearerToken(header: string | undefined): string | null {
  if (!header) return null
  const [scheme, token] = header.split(' ')
  if (scheme?.toLowerCase() !== 'bearer' || !token) return null
  return token
}

export function createRequireAuth(): RequestHandler {
  return async (req, _res, next) => {
    const token = bearerToken(req.headers.authorization)
    if (!token) {
      next(new UnauthorizedError('Sign in to continue.'))
      return
    }

    // A malformed token makes getClaims reject rather than return an error, so
    // both paths converge on the same 401.
    let userId: string | undefined
    try {
      const { data, error } = await getVerifierClient().auth.getClaims(token)
      if (error || !data) {
        next(new UnauthorizedError('Your session has expired. Sign in again.'))
        return
      }
      userId = data.claims.sub
    } catch {
      next(new UnauthorizedError('Your session has expired. Sign in again.'))
      return
    }

    if (!userId) {
      next(new UnauthorizedError('Your session has expired. Sign in again.'))
      return
    }

    req.auth = { userId, accessToken: token }
    next()
  }
}

/** Narrows `req.auth` for handlers behind `requireAuth`, without a `!` per call site. */
export function requireAuthContext(auth: AuthContext | undefined): AuthContext {
  if (!auth) throw new UnauthorizedError()
  return auth
}
