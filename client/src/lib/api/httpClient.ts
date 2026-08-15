import { supabase } from '../supabase'
import type { ApiErrorBody, ApiErrorCode } from '../../types/api'

/** Same-origin by default, so there is no cross-origin request and no CORS layer. */
const BASE_URL = import.meta.env.VITE_API_BASE_URL ?? '/api'

const JSON_HEADERS: Readonly<Record<string, string>> = { 'Content-Type': 'application/json' }

/** Carries the server's stable `code`, so callers branch on it, not on prose. */
export class ApiError extends Error {
  readonly code: ApiErrorCode | string
  readonly status: number

  constructor(message: string, code: ApiErrorCode | string, status: number) {
    super(message)
    this.name = 'ApiError'
    this.code = code
    this.status = status
  }
}

/** Whether a rejection is the caller's own cancellation rather than a failure. */
export function isAbortError(error: unknown): boolean {
  return error instanceof DOMException && error.name === 'AbortError'
}

export function toMessage(error: unknown, fallback: string): string {
  if (error instanceof ApiError) return error.message
  if (error instanceof Error) return error.message
  return fallback
}

function isErrorBody(body: unknown): body is ApiErrorBody {
  if (typeof body !== 'object' || body === null || !('error' in body)) return false
  const { error } = body as { error: unknown }
  return (
    typeof error === 'object' &&
    error !== null &&
    'message' in error &&
    typeof (error as { message: unknown }).message === 'string'
  )
}

async function toApiError(response: Response): Promise<ApiError> {
  const body: unknown = await response.json().catch(() => null)
  if (isErrorBody(body)) {
    const code = typeof body.error.code === 'string' ? body.error.code : 'internal_error'
    return new ApiError(body.error.message, code, response.status)
  }
  return new ApiError('The request could not be completed.', 'internal_error', response.status)
}

export interface RequestOptions {
  method?: 'GET' | 'POST'
  body?: unknown
  /** Bearer token; omitted entirely when the user is not signed in. */
  accessToken?: string
  signal?: AbortSignal
}

/** The single place a network call is made, so error translation happens once. */
export async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { method = 'GET', body, accessToken, signal } = options

  let response: Response
  try {
    response = await fetch(`${BASE_URL}${path}`, {
      method,
      signal,
      headers: accessToken
        ? { ...JSON_HEADERS, Authorization: `Bearer ${accessToken}` }
        : JSON_HEADERS,
      body: body === undefined ? undefined : JSON.stringify(body),
    })
  } catch (cause) {
    if (isAbortError(cause)) throw cause
    // fetch only rejects for transport failures; everything else is a status.
    throw new ApiError('The server could not be reached.', 'network_error', 0)
  }

  if (!response.ok) {
    const error = await toApiError(response)

    // The session the UI is showing does not exist; signing out lets
    // `onAuthStateChange` return to the sign-in screen. Not awaited — the
    // caller is owed its rejection now.
    if (error.code === 'unauthorized') void supabase?.auth.signOut()

    throw error
  }

  return (await response.json()) as T
}
