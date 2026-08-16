import { memo, useMemo, useRef, type ChangeEvent, type UIEvent } from 'react'

interface LineNumberedTextareaProps {
  id: string
  value: string
  onChange: (event: ChangeEvent<HTMLTextAreaElement>) => void
  placeholder: string
  rows: number
  required?: boolean
  className?: string
}

/** Counts newlines without the throwaway array `split('\n').length` allocates. */
function countLines(value: string): number {
  let lines = 1
  for (let index = value.indexOf('\n'); index !== -1; index = value.indexOf('\n', index + 1)) {
    lines += 1
  }
  return lines
}

function buildGutter(lineCount: number): string {
  let gutter = '1'
  for (let line = 2; line <= lineCount; line += 1) gutter += `\n${line}`
  return gutter
}

export const LineNumberedTextarea = memo(function LineNumberedTextarea({
  id,
  value,
  onChange,
  placeholder,
  rows,
  required = false,
  className = '',
}: LineNumberedTextareaProps) {
  const gutter = useRef<HTMLOutputElement>(null)
  const lineCount = Math.max(countLines(value), rows)

  // Changes only when a line is added or removed, not per character typed.
  const lineNumbers = useMemo(() => buildGutter(lineCount), [lineCount])

  function syncScroll(event: UIEvent<HTMLTextAreaElement>) {
    // Straight to the DOM, not state: this fires at scroll frequency.
    if (gutter.current) gutter.current.scrollTop = event.currentTarget.scrollTop
  }

  return (
    <section className={`line-numbered-input ${className}`}>
      <output className="line-numbers" aria-hidden="true" ref={gutter}>
        {lineNumbers}
      </output>
      <textarea
        id={id}
        name={id}
        value={value}
        onChange={onChange}
        onScroll={syncScroll}
        placeholder={placeholder}
        rows={rows}
        required={required}
        spellCheck={false}
        // Pasted specs and diffs are never a saved value; the prompt is noise.
        autoComplete="off"
      />
    </section>
  )
})
