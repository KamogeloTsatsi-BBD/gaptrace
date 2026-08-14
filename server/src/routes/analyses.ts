import { Router } from 'express'
import * as z from 'zod/v4'
import { InvalidInputError, NotFoundError } from '../lib/errors.js'
import { runAnalysis } from '../services/analysisPipeline.js'
import type { AnalysisStore } from '../repositories/analysisStore.js'
import type { CodeSourceInput } from '../sources/codeSource.js'
import type { AnalysisReport } from '../types.js'

/** How many past analyses `GET /api/analyses` returns by default. */
const DEFAULT_LIST_LIMIT = 20
const MAX_LIST_LIMIT = 100

/** Enough requirement text for a list row to be recognisable. */
const PREVIEW_CHARS = 140

const AnalysisRequestBody = z
  .object({
    requirementText: z.string().min(1, 'requirementText is required.'),
    diffText: z.string().optional(),
    prUrl: z.string().optional(),
  })
  // Not `.optional()`-and-hope: sending both is ambiguous about which one the
  // user meant, and silently preferring one would analyse code they didn't
  // ask about.
  .refine(
    (body) => (body.diffText === undefined) !== (body.prUrl === undefined),
    'Provide exactly one of diffText or prUrl.',
  )

function parseBody(body: unknown): z.infer<typeof AnalysisRequestBody> {
  const result = AnalysisRequestBody.safeParse(body)
  if (result.success) return result.data

  const detail = result.error.issues
    .map((issue) => `${issue.path.join('.') || 'body'}: ${issue.message}`)
    .join('; ')
  throw new InvalidInputError(detail)
}

/**
 * The `refine` above already guarantees exactly one branch is present; this
 * narrows it for the type system without a cast, and the final throw is the
 * unreachable-but-honest fallback.
 */
function toCodeSource(body: z.infer<typeof AnalysisRequestBody>): CodeSourceInput {
  if (body.prUrl !== undefined) return { kind: 'pr', prUrl: body.prUrl }
  if (body.diffText !== undefined) return { kind: 'diff', diffText: body.diffText }
  throw new InvalidInputError('Provide exactly one of diffText or prUrl.')
}

/**
 * The list view doesn't need every verdict — just enough to render a row and
 * link through. Keeps the payload flat as the history grows.
 */
function toListItem(report: AnalysisReport) {
  const { id, createdAt, prReference, summary, requirementText } = report
  return {
    id,
    createdAt,
    prReference,
    summary,
    requirementPreview:
      requirementText.length > PREVIEW_CHARS
        ? `${requirementText.slice(0, PREVIEW_CHARS).trimEnd()}…`
        : requirementText,
  }
}

export function createAnalysesRouter(store: AnalysisStore): Router {
  const router = Router()

  router.post('/', async (req, res) => {
    const body = parseBody(req.body)

    const report = await runAnalysis({
      requirementText: body.requirementText,
      code: toCodeSource(body),
    })

    await store.save(report)
    res.status(201).json(report)
  })

  router.get('/', async (req, res) => {
    const requested = Number(req.query.limit ?? DEFAULT_LIST_LIMIT)
    if (!Number.isInteger(requested) || requested < 1 || requested > MAX_LIST_LIMIT) {
      throw new InvalidInputError(`limit must be an integer between 1 and ${MAX_LIST_LIMIT}.`)
    }

    const reports = await store.list(requested)
    res.json({ analyses: reports.map(toListItem) })
  })

  router.get('/:id', async (req, res) => {
    const report = await store.findById(req.params.id)
    if (!report) {
      throw new NotFoundError('No analysis with that id.')
    }
    res.json(report)
  })

  return router
}
