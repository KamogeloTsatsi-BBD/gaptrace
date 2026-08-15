import * as z from 'zod/v4'
import { zodOutputFormat } from '@anthropic-ai/sdk/helpers/zod'
import { defaultAiDeps } from '../lib/claude.js'
import type { AiDeps } from '../lib/claude.js'
import { mapWithLimit } from '../lib/concurrency.js'
import { InvalidInputError } from '../lib/errors.js'
import { consoleLogger, describeError } from '../lib/logger.js'
import type { Logger } from '../lib/logger.js'
import { GAP_CATEGORIES } from '../types.js'
import type { CriterionVerdict, EvaluatedCriterion, ParsedCriterion } from '../types.js'

const CONCURRENCY = 4

/** The diff is re-sent per criterion, so an oversized one multiplies cost. ~75k tokens. */
export const MAX_DIFF_CHARS = 300_000

export interface ComparatorDeps extends AiDeps {
  logger: Logger
}

const defaultComparatorDeps: ComparatorDeps = { ...defaultAiDeps, logger: consoleLogger }

const Verdict = z.object({
  status: z.enum(['full', 'partial', 'missing', 'needs_review']),
  reason: z.string().describe('One sentence. Say what the diff does or fails to do.'),
  // An empty array is normalised to 'none' below, keeping the schema a plain array.
  evidence: z
    .array(
      z.object({
        file: z.string().describe('Path as it appears in the diff.'),
        lines: z.string().describe('Line or hunk reference, e.g. "42-57".'),
      }),
    )
    .describe('Hunks that back the verdict. Empty when nothing addresses the criterion.'),
  confidence: z.number().describe('Between 0 and 1.'),
  category: z
    .enum(GAP_CATEGORIES)
    .nullable()
    .describe('Gap category for partial/missing verdicts. Null for full and needs_review.'),
})

const INSTRUCTIONS = `You check one acceptance criterion against a pull request diff.

Judge only what the diff shows. You are seeing a diff, not the whole repository,
so absence of code is weak evidence: if the criterion could plausibly be
satisfied by code outside this diff, that is needs_review, not missing.

Choose exactly one status:
- full: the diff fully implements the criterion.
- partial: the diff addresses the criterion but leaves a real gap.
- missing: the diff was expected to cover this and does not.
- needs_review: you genuinely cannot tell from the diff alone. Use this rather
  than guessing — an honest needs_review is more useful than a confident wrong
  verdict.

Cite evidence for every verdict that has any: the files and line ranges that
made you decide. Leave evidence empty only when nothing in the diff bears on the
criterion at all. Evidence is the audit trail, so cite what you actually used,
not what looks convincing.

Set category only for partial and missing, choosing the taxonomy entry that best
describes the nature of the gap. Use null for full and needs_review.

Confidence is a secondary signal — how sure you are, given that a diff is a
partial view. Do not inflate it to look decisive.`

/** The schema can't bound numbers, but `criteria` has a CHECK that would reject it. */
function clampConfidence(value: number): number {
  if (!Number.isFinite(value)) return 0
  return Math.min(1, Math.max(0, value))
}

/** The diff sits in a cached system block so calls in a batch share it. */
async function compareOne(
  criterion: ParsedCriterion,
  diffText: string,
  deps: ComparatorDeps,
): Promise<CriterionVerdict> {
  const response = await deps.claude.messages.parse({
    model: deps.model,
    max_tokens: 16000,
    output_config: {
      effort: 'medium',
      format: zodOutputFormat(Verdict),
    },
    system: [
      { type: 'text', text: INSTRUCTIONS },
      {
        type: 'text',
        text: `Here is the diff under review:\n\n${diffText}`,
        cache_control: { type: 'ephemeral' },
      },
    ],
    messages: [{ role: 'user', content: `Criterion to check:\n\n${criterion.text}` }],
  })

  const verdict = response.parsed_output
  if (!verdict) {
    throw new Error('groundedComparator: model returned no parseable output')
  }

  const base = {
    reason: verdict.reason,
    evidence: verdict.evidence.length > 0 ? verdict.evidence : ('none' as const),
    confidence: clampConfidence(verdict.confidence),
  }

  // Re-enforce the status/category pairing; either mismatch corrupts aggregation.
  const { status } = verdict
  if (status !== 'partial' && status !== 'missing') {
    return { ...base, status, category: null }
  }

  if (verdict.category === null) {
    // The 'other' fallback below is indistinguishable from a genuine 'other'.
    deps.logger.warn('groundedComparator: gap verdict had no category; defaulting to other', {
      criterionId: criterion.id,
      status,
    })
  }

  return { ...base, status, category: verdict.category ?? 'other' }
}

/** Criteria that can't be judged from code skip the LLM call entirely. */
function notVerifiable(): CriterionVerdict {
  return {
    status: 'needs_review',
    reason: 'Not verifiable from code.',
    evidence: 'none',
    confidence: 1,
    category: null,
  }
}

/** A failed call collapses into needs_review rather than sinking the batch. */
function couldNotEvaluate(criterionId: string, error: unknown, logger: Logger): CriterionVerdict {
  logger.error('groundedComparator: criterion evaluation failed', {
    criterionId,
    error: describeError(error),
  })
  return {
    status: 'needs_review',
    reason: "Couldn't evaluate this criterion.",
    evidence: 'none',
    confidence: 0,
    category: null,
  }
}

/** Tracked by position, not id: duplicate ids would mispair criteria and verdicts. */
export async function compareAll(
  criteria: readonly ParsedCriterion[],
  diffText: string,
  deps: ComparatorDeps = defaultComparatorDeps,
): Promise<EvaluatedCriterion[]> {
  if (criteria.length === 0) return []

  const diff = diffText.trim()

  if (diff.length === 0) {
    throw new InvalidInputError('Diff is empty.')
  }
  if (diff.length > MAX_DIFF_CHARS) {
    throw new InvalidInputError(
      `Diff is ${diff.length} characters; the limit is ${MAX_DIFF_CHARS}.`,
    )
  }

  const verdicts = new Array<CriterionVerdict>(criteria.length)
  const pending: number[] = []

  criteria.forEach((criterion, index) => {
    if (criterion.verifiable) {
      pending.push(index)
    } else {
      verdicts[index] = notVerifiable()
    }
  })

  const evaluate = async (index: number): Promise<void> => {
    const criterion = criteria[index]
    try {
      verdicts[index] = await compareOne(criterion, diff, deps)
    } catch (error) {
      verdicts[index] = couldNotEvaluate(criterion.id, error, deps.logger)
    }
  }

  // The first call runs alone to write the diff into the prompt cache. Firing
  // them all at once would make every one miss.
  const [warmup, ...rest] = pending
  if (warmup !== undefined) await evaluate(warmup)
  await mapWithLimit(rest, CONCURRENCY, evaluate)

  return criteria.map((criterion, index) => ({ ...criterion, ...verdicts[index] }))
}
