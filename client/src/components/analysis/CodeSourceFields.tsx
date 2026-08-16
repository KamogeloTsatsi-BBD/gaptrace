import type { ChangeEvent } from 'react'
import { DiffPreview } from './DiffPreview'
import { LineNumberedTextarea } from '../ui/LineNumberedTextarea'

export type CodeSourceKind = 'diff' | 'pr'

interface CodeSourceFieldsProps {
  kind: CodeSourceKind
  diffText: string
  prUrl: string
  onKindChange: (kind: CodeSourceKind) => void
  onDiffTextChange: (event: ChangeEvent<HTMLTextAreaElement>) => void
  onPrUrlChange: (event: ChangeEvent<HTMLInputElement>) => void
}

/** The half of the form that changes shape with the chosen source. */
export function CodeSourceFields({
  kind,
  diffText,
  prUrl,
  onKindChange,
  onDiffTextChange,
  onPrUrlChange,
}: CodeSourceFieldsProps) {
  return (
    <fieldset>
      <legend className="visually-hidden">Code source</legend>
      <h2 className="fieldset-title">Code source</h2>

      <section className="source-toggle" aria-label="Code source type">
        <label htmlFor="source-diff">
          <input
            type="radio"
            id="source-diff"
            name="source-type"
            value="diff"
            checked={kind === 'diff'}
            onChange={() => onKindChange('diff')}
          />
          Paste diff
        </label>
        <label htmlFor="source-pr">
          <input
            type="radio"
            id="source-pr"
            name="source-type"
            value="pr"
            checked={kind === 'pr'}
            onChange={() => onKindChange('pr')}
          />
          Public PR or MR link
        </label>
      </section>

      {/* Labels sit beside their control: wrapping the diff textarea folded the
          whole rendered preview into the field's accessible name. */}
      {kind === 'diff' ? (
        <section className="field">
          <label htmlFor="diff-text">Unified diff</label>
          <LineNumberedTextarea
            className="diff-input"
            id="diff-text"
            value={diffText}
            onChange={onDiffTextChange}
            placeholder="diff --git a/... b/..."
            rows={12}
            required
          />
          <DiffPreview diff={diffText} />
        </section>
      ) : (
        <section className="field">
          <label htmlFor="pr-url">Public GitHub or GitLab pull request URL</label>
          <input
            id="pr-url"
            type="url"
            value={prUrl}
            onChange={onPrUrlChange}
            placeholder="https://github.com/org/repo/pull/123"
            required
          />
          <p className="field-help">
            Private links cannot be fetched. Paste the diff instead.
          </p>
        </section>
      )}
    </fieldset>
  )
}
