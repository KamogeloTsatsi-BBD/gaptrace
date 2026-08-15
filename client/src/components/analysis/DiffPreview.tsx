import { memo, useMemo } from 'react'

/** Beyond this the preview stops being readable and starts being a cost. */
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
  // Ordered by specificity: the file markers `+++`/`---` must be caught before
  // the single-character addition and deletion tests.
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
    // Classify once, here, rather than during render of each row.
    lines: shown.map((text) => ({ kind: classifyLine(text), text })),
    totalLines: rawLines.length,
    truncated: visible,
  }
}

/**
 * Rows are memoised individually because the parent re-renders on every
 * keystroke in the textarea beside it, while any given line's content changes
 * only when that line is edited.
 */
const DiffRow = memo(function DiffRow({ kind, text }: DiffLine) {
  return (
    <li className={kind}>
      <code>{text || ' '}</code>
    </li>
  )
})

export function DiffPreview({ diff }: { diff: string }) {
  const trimmed = diff.trim()
  // Splitting and classifying up to 500 lines on every keystroke is the single
  // most expensive thing this form does; it depends only on the diff text.
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
          // Lines are identified by position: two identical lines in a diff are
          // genuinely interchangeable, and the list is never reordered.
          <DiffRow key={index} kind={line.kind} text={line.text} />
        ))}
      </ol>
    </section>
  )
}
