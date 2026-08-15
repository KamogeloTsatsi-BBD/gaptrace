import Anthropic from '@anthropic-ai/sdk'

// The SDK default is 10 minutes, long enough for one wedged criterion to hold
// the whole analysis open.
const REQUEST_TIMEOUT_MS = 120_000

/** Covers transient 429s and 5xx. Worst case per call: 2 x timeout. */
const MAX_RETRIES = 1

export const claude = new Anthropic({
  timeout: REQUEST_TIMEOUT_MS,
  maxRetries: MAX_RETRIES,
})

/** One constant, one-line swap. */
export const MODEL = 'claude-sonnet-5'

/** `Pick` keeps the real signature, and its `parsed_output` inference, at call sites. */
export interface MessageParser {
  messages: Pick<Anthropic['messages'], 'parse'>
}

/** Passed in rather than imported, so services stay testable in isolation. */
export interface AiDeps {
  claude: MessageParser
  model: string
}

export const defaultAiDeps: AiDeps = { claude, model: MODEL }
