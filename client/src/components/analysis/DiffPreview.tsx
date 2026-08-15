import { memo, useMemo } from 'react'

const MAX_PREVIEW_LINES = 500

type DiffLineKind =
  | 'diff-file'
  | 'diff-hunk'
  | 'diff-addition'
  | 'diff-deletion'
  | 'diff-context'

interface DiffLine {
  kind: DiffLineKind
  text: string
}

function classifyLine(line: string): DiffLineKind {
  // Ordered by specificity: `+++`/`---` must be caught before the +/- tests.
  if (line.startsWith('+++ ') || line.startsWith('--- ') || line.startsWith('diff --git')) {
    return 'diff-file'
  }
  if (line.startsWith('@@')) return 'diff-hunk'
  if (line.startsWith('+') && !line.startsWith('+++')) return 'diff-addition'
  if (line.startsWith('-') && !line.startsWith('---')) return 'diff-deletion'
  return 'diff-context'
}

interface ParsedDiff {
  lines: DiffLine[]
  totalLines: number
  truncated: boolean
}

function parseDiff(diff: string): ParsedDiff {
  const rawLines = diff.split('\n')
  const visible = rawLines.length > MAX_PREVIEW_LINES
  const shown = visible ? rawLines.slice(0, MAX_PREVIEW_LINES) : rawLines
  return {
    // Classified once here rather than during each row's render.
    lines: shown.map((text) => ({ kind: classifyLine(text), text })),
    totalLines: rawLines.length,
    truncated: visible,
  }
}

/** Memoised per row: the parent re-renders on every keystroke in the textarea. */
const DiffRow = memo(function DiffRow({ kind, text }: DiffLine) {
  return (
    <li className={kind}>
      <code>{text || ' '}</code>
    </li>
  )
})

export function DiffPreview({ diff }: { diff: string }) {
  const trimmed = diff.trim()
  // Classifying up to 500 lines per keystroke is the most expensive thing this
  // form does, and it depends only on the diff text.
  const parsed = useMemo(() => (trimmed ? parseDiff(diff) : null), [diff, trimmed])

  if (!parsed) return null

  return (
    <section className="diff-preview-section" aria-labelledby="diff-preview-title">
      <header>
        <h3 id="diff-preview-title">Diff preview</h3>
        <p>
          {parsed.truncated
            ? `Showing the first ${MAX_PREVIEW_LINES} of ${parsed.totalLines} lines.`
            : `${parsed.totalLines} lines`}
        </p>
      </header>
      <ol className="diff-preview" aria-label="Pasted diff preview">
        {parsed.lines.map((line, index) => (
          // Keyed by position: the list is never reordered.
          <DiffRow key={index} kind={line.kind} text={line.text} />
        ))}
      </ol>
    </section>
  )
}
