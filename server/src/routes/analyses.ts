import { Router } from 'express'
import * as z from 'zod/v4'
import { InvalidInputError, NotFoundError } from '../lib/errors.js'
import { requireAuthContext } from '../middleware/requireAuth.js'
import { runAnalysis } from '../services/analysisPipeline.js'
import type { AnalysisStoreFactory } from '../repositories/analysisStore.js'
import type { CodeSourceInput } from '../sources/codeSource.js'
import type { AnalysisReport } from '../types.js'

const DEFAULT_LIST_LIMIT = 20
const MAX_LIST_LIMIT = 100
const PREVIEW_CHARS = 140

const AnalysisRequestBody = z
  .object({
    requirementText: z.string().min(1, 'requirementText is required.'),
    diffText: z.string().optional(),
    prUrl: z.string().optional(),
  })
  // Sending both is ambiguous, and preferring one silently would analyse code
  // the user didn't ask about.
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

/** Narrows what `refine` already guarantees, without a cast. */
function toCodeSource(body: z.infer<typeof AnalysisRequestBody>): CodeSourceInput {
  if (body.prUrl !== undefined) return { kind: 'pr', prUrl: body.prUrl }
  if (body.diffText !== undefined) return { kind: 'diff', diffText: body.diffText }
  throw new InvalidInputError('Provide exactly one of diffText or prUrl.')
}

/** Enough to render a row and link through, so the payload stays flat. */
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

/** Rejected here so an unparseable id can't reach Postgres and 500 as a cast failure. */
function parseId(raw: string): number {
  const id = Number(raw)
  if (!Number.isInteger(id) || id < 1) {
    throw new InvalidInputError('An analysis id must be a positive integer.')
  }
  return id
}

/** A factory: the store is request-scoped and carries the caller's token. */
export function createAnalysesRouter(stores: AnalysisStoreFactory): Router {
  const router = Router()

  router.post('/', async (req, res) => {
    const auth = requireAuthContext(req.auth)
    const body = parseBody(req.body)

    const draft = await runAnalysis({
      requirementText: body.requirementText,
      code: toCodeSource(body),
    })

    // The saved report, not the draft — the id and timestamp are the database's.
    const report = await stores(auth).save(draft)
    res.status(201).json(report)
  })

  router.get('/', async (req, res) => {
    const auth = requireAuthContext(req.auth)

    const requested = Number(req.query.limit ?? DEFAULT_LIST_LIMIT)
    if (!Number.isInteger(requested) || requested < 1 || requested > MAX_LIST_LIMIT) {
      throw new InvalidInputError(`limit must be an integer between 1 and ${MAX_LIST_LIMIT}.`)
    }

    const reports = await stores(auth).list(requested)
    res.json({ analyses: reports.map(toListItem) })
  })

  router.get('/:id', async (req, res) => {
    const auth = requireAuthContext(req.auth)

    // Another user's analysis is absent, not forbidden: RLS filters it out
    // before this sees it, so it arrives as null and answers 404.
    const report = await stores(auth).findById(parseId(req.params.id))
    if (!report) {
      throw new NotFoundError('No analysis with that id.')
    }
    res.json(report)
  })

  return router
}
