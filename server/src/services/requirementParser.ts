import * as z from 'zod/v4'
import { zodOutputFormat } from '@anthropic-ai/sdk/helpers/zod'
import { defaultAiDeps } from '../lib/claude.js'
import type { AiDeps } from '../lib/claude.js'
import { InvalidInputError } from '../lib/errors.js'
import type { ParsedCriterion } from '../types.js'

/** Requirement text is a ticket body, not a document. */
export const MAX_REQUIREMENT_CHARS = 50_000

/**
 * Ceiling on criteria per requirement. The comparator fires one call per
 * criterion, so an unbounded list is an unbounded bill.
 */
export const MAX_CRITERIA = 50

const ParsedCriteria = z.object({
  criteria: z.array(
    z.object({
      text: z
        .string()
        .describe('The criterion, restated as one atomic, independently-verifiable assertion.'),
      verifiable: z
        .boolean()
        .describe('False when the criterion cannot be judged from code alone.'),
    }),
  ),
})

const SYSTEM = `You split a requirement into discrete, checkable acceptance criteria.

Granularity rule: one atomic, independently-verifiable assertion per criterion.
"Users can reset their password via email" is one criterion. "Validate the email
and rate-limit the endpoint" is two.

The input may arrive as Gherkin, bullets, a numbered list, or loose prose. Read
past the formatting and extract the substance. Do not invent criteria the
requirement does not state, and do not merge two distinct assertions to keep the
list short.

Set verifiable to false for criteria that cannot be judged by reading code — "it
should feel fast", "the UX should be intuitive", anything needing a human,
a running system, or a design review to settle. Everything else is verifiable.`

/**
 * Step 1 of the pipeline: requirement text -> discrete criteria.
 * IDs are assigned here so the rest of the pipeline has stable handles.
 *
 * @throws {InvalidInputError} when the requirement is empty, oversized, or
 * yields more than MAX_CRITERIA criteria.
 */
export async function parseRequirement(
  requirementText: string,
  deps: AiDeps = defaultAiDeps,
): Promise<ParsedCriterion[]> {
  const requirement = requirementText.trim()

  if (requirement.length === 0) {
    throw new InvalidInputError('Requirement text is empty.')
  }
  if (requirement.length > MAX_REQUIREMENT_CHARS) {
    throw new InvalidInputError(
      `Requirement text is ${requirement.length} characters; the limit is ${MAX_REQUIREMENT_CHARS}.`,
    )
  }

  const response = await deps.claude.messages.parse({
    model: deps.model,
    max_tokens: 16000,
    output_config: {
      effort: 'medium',
      format: zodOutputFormat(ParsedCriteria),
    },
    system: SYSTEM,
    messages: [
      {
        role: 'user',
        content: `Extract the acceptance criteria from this requirement:\n\n${requirement}`,
      },
    ],
  })

  if (!response.parsed_output) {
    throw new Error('requirementParser: model returned no parseable output')
  }

  const { criteria } = response.parsed_output

  if (criteria.length > MAX_CRITERIA) {
    throw new InvalidInputError(
      `Requirement yielded ${criteria.length} criteria; the limit is ${MAX_CRITERIA}. Split it into smaller requirements.`,
    )
  }

  return criteria.map((criterion, index) => ({
    id: `c${index + 1}`,
    text: criterion.text,
    verifiable: criterion.verifiable,
  }))
}
