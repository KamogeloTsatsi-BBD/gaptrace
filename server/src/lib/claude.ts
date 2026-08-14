import Anthropic from '@anthropic-ai/sdk'

/**
 * Per-request ceiling. The SDK default is 10 minutes, which is far too long
 * for a fan-out sitting behind an HTTP endpoint — one wedged criterion would
 * hold the whole analysis open.
 */
const REQUEST_TIMEOUT_MS = 120_000

/** Retries cover transient 429s and 5xx. Worst case per call: 2 x timeout. */
const MAX_RETRIES = 1

/**
 * Single Anthropic client for the whole server. The API key is read from
 * ANTHROPIC_API_KEY and never leaves this process.
 */
export const claude = new Anthropic({
  timeout: REQUEST_TIMEOUT_MS,
  maxRetries: MAX_RETRIES,
})

/**
 * One constant, one-line swap. Sonnet 5 is the default because the comparator
 * fires one call per criterion; swap to 'claude-opus-5' if a step needs more
 * reasoning power.
 */
export const MODEL = 'claude-sonnet-5'

/**
 * The slice of the client the AI services actually use. Narrower than
 * `Anthropic` so a stand-in only has to provide `parse`, while `Pick` keeps
 * the real signature — and its `parsed_output` inference — intact at the call
 * site.
 *
 * Note: `parse` returns the SDK's `APIPromise`, a class with private fields,
 * so a hand-rolled fake still has to cast its return value. Keeping the exact
 * signature is the deliberate trade: call-site type safety over mock ergonomics.
 */
export interface MessageParser {
  messages: Pick<Anthropic['messages'], 'parse'>
}

/**
 * What an AI service needs to talk to the model. Passed in rather than
 * imported so services stay swappable and testable in isolation.
 */
export interface AiDeps {
  claude: MessageParser
  model: string
}

export const defaultAiDeps: AiDeps = { claude, model: MODEL }
