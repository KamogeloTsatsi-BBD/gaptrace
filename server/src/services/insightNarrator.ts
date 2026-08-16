/**
 * The one AI call in the insights layer. It reads the compact substrate, never
 * raw diffs, so a narration costs the same at 500 analyses as at 10.
 */
import * as z from 'zod/v4'
import { zodOutputFormat } from '@anthropic-ai/sdk/helpers/zod'
import { defaultAiDeps } from '../lib/claude.js'
import type { AiDeps } from '../lib/claude.js'
import { InvalidInputError } from '../lib/errors.js'
import type { InsightSubstrate, NarrativeCard } from '../types.js'

const MAX_CARDS = 6

/**
 * Folded into the narrative cache key. The cache is a hash of the substrate, so
 * without this a prompt fix would never reach anyone whose numbers had not
 * moved — they would keep being served wording this version exists to correct.
 * Bump it whenever the prompt or the output schema changes.
 */
export const NARRATOR_VERSION = 2

const Narrative = z.object({
  cards: z
    .array(
      z.object({
        audience: z
          .enum(['dev', 'ba', 'both'])
          .describe('Who needs to act: dev, ba (the person writing requirements), or both.'),
        finding: z.string().describe('One sentence. The pattern, stated plainly.'),
        groundingStat: z
          .string()
          .describe(
            'Plain English containing the exact figure, e.g. "error handling was the top gap in 4 of 6 analyses". Never a field name or a fragment of the data. No invented figures.',
          ),
        hypothesis: z
          .string()
          .describe('One sentence on the likely cause, worded as a possibility, not a fact.'),
        suggestedAction: z.string().describe('One concrete, doable next step.'),
        severity: z.enum(['low', 'medium', 'high']),
      }),
    )
    .describe(`At most ${MAX_CARDS} cards, most important first.`),
})

const SYSTEM = `You read aggregated results from a requirement-to-code traceability
tool and tell the team what has been happening across their recent pull requests.

Two audiences, and they need different things:
- dev: how code gets delivered — the same categories of work being missed, or
  work being shipped that no criterion asked for.
- ba: how requirements get written — criteria too vague to check, criteria that
  bundle several assertions so only half gets built, requirements too large.

Write for both. A dashboard that only ever blames one side stops being read by
the other.

Rules:
- Every finding must be anchored to a number that appears in the data you were
  given. Never invent or estimate a figure. If the data does not support a
  finding, do not make it.
- The data arrives as JSON, but every word you write is read by a person. Never
  put a field name in your output. "meanUncitedRatio: 0.6" is a leaked
  implementation detail; "on average 60% of changed files were cited by no
  criterion" is the same fact, said properly. Rates are fractions between 0 and
  1 — write them as percentages.
- hypothesis is a guess about cause and must read like one. Wording such as
  "this may indicate" or "one explanation is" — never state a cause as fact.
- Be constructive and specific. "Devs are careless" is useless; "error handling
  was the top gap in 4 of 6 analyses, so it may be worth a checklist item" is
  useful.
- Prefer patterns over one-offs. A category appearing across several analyses
  matters more than a big count inside a single one — the data gives you both.
- Say less when the data says less. With few analyses, or no clear pattern, a
  couple of tentative cards is the honest answer. Do not pad to fill space.

On the scope figures: uncited files are changed files that no criterion cited as
evidence. It is a rough proxy for work beyond the stated scope, and it
over-counts — tests, refactors and generated files go uncited for ordinary
reasons. Treat a high ratio as a question worth asking, never as proof of
overengineering, and say so in the hypothesis.`

export interface NarratorDeps extends AiDeps {}

/** @throws {InvalidInputError} when there is nothing to narrate. */
export async function narrateInsights(
  substrate: InsightSubstrate,
  deps: NarratorDeps = defaultAiDeps,
): Promise<NarrativeCard[]> {
  if (substrate.analysisCount === 0 || substrate.criterionCount === 0) {
    throw new InvalidInputError('No analyses yet — run some before generating insights.')
  }

  const response = await deps.claude.messages.parse({
    model: deps.model,
    max_tokens: 8000,
    output_config: {
      effort: 'medium',
      format: zodOutputFormat(Narrative),
    },
    system: SYSTEM,
    messages: [
      {
        role: 'user',
        content: `Here are the aggregated results. Every number below is exact.\n\n${JSON.stringify(substrate, null, 2)}`,
      },
    ],
  })

  if (!response.parsed_output) {
    throw new Error('insightNarrator: model returned no parseable output')
  }

  // The schema cannot express a maximum length, so trim here.
  return response.parsed_output.cards.slice(0, MAX_CARDS)
}
