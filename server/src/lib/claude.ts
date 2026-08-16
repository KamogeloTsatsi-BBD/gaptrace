import Anthropic from '@anthropic-ai/sdk'

const REQUEST_TIMEOUT_MS = 45_000

/** Covers transient 429s and 5xx. Worst case per call: 2 x timeout. */
const MAX_RETRIES = 1

export const claude = new Anthropic({
  timeout: REQUEST_TIMEOUT_MS,
  maxRetries: MAX_RETRIES,
})

export const MODEL = 'claude-sonnet-5'

export interface MessageParser {
  messages: Pick<Anthropic['messages'], 'parse'>
}

export interface AiDeps {
  claude: MessageParser
  model: string
}

export const defaultAiDeps: AiDeps = { claude, model: MODEL }
