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

/**
 * Counts newlines without allocating the split array. On a large pasted diff
 * this runs on every keystroke, and `value.split('\n').length` builds a
 * throwaway array of every line to read one number off it.
 */
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

  // The gutter string only changes when a line is added or removed, not on
  // every character typed into an existing line.
  const lineNumbers = useMemo(() => buildGutter(lineCount), [lineCount])

  function syncScroll(event: UIEvent<HTMLTextAreaElement>) {
    // Written straight to the DOM node rather than held in state: this fires
    // at scroll frequency and no other part of the UI derives from it.
    if (gutter.current) gutter.current.scrollTop = event.currentTarget.scrollTop
  }

  return (
    <section className={`line-numbered-input ${className}`}>
      <output className="line-numbers" aria-hidden="true" ref={gutter}>
        {lineNumbers}
      </output>
      <textarea
        id={id}
        value={value}
        onChange={onChange}
        onScroll={syncScroll}
        placeholder={placeholder}
        rows={rows}
        required={required}
        spellCheck={false}
      />
    </section>
  )
})
