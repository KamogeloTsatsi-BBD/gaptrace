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

/**
 * The half of the form that changes shape. Split out because "which source is
 * this and what does it need from the user" is a separate concern from "the
 * requirement text and how the form submits" — and because adding an
 * authenticated source later should touch one file.
 */
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
        <label>
          <input
            type="radio"
            name="source-type"
            value="diff"
            checked={kind === 'diff'}
            onChange={() => onKindChange('diff')}
          />{' '}
          Paste diff
        </label>
        <label>
          <input
            type="radio"
            name="source-type"
            value="pr"
            checked={kind === 'pr'}
            onChange={() => onKindChange('pr')}
          />{' '}
          Public PR or MR link
        </label>
      </section>

      {/* The label sits beside each control rather than wrapping it. Wrapping
          the diff textarea folded the entire rendered preview into the field's
          accessible name, which a screen reader then read out in full. */}
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
