import { useCallback, useState, type ChangeEvent, type FormEvent } from 'react'
import { CodeSourceFields, type CodeSourceKind } from './CodeSourceFields'
import { LineNumberedTextarea } from '../ui/LineNumberedTextarea'
import type { CreateAnalysisRequest } from '../../types/api'

interface AnalysisFormProps {
  onSubmit: (body: CreateAnalysisRequest) => void
  submitting: boolean
}

/** Owns the draft being composed. It hands up a request body, never a call. */
export function AnalysisForm({ onSubmit, submitting }: AnalysisFormProps) {
  const [sourceKind, setSourceKind] = useState<CodeSourceKind>('diff')
  const [requirementText, setRequirementText] = useState('')
  const [diffText, setDiffText] = useState('')
  const [prUrl, setPrUrl] = useState('')

  // Stable identities: the textareas are memoised, and a fresh arrow per
  // keystroke would defeat that where it matters most.
  const handleRequirementChange = useCallback(
    (event: ChangeEvent<HTMLTextAreaElement>) => setRequirementText(event.target.value),
    [],
  )
  const handleDiffChange = useCallback(
    (event: ChangeEvent<HTMLTextAreaElement>) => setDiffText(event.target.value),
    [],
  )
  const handlePrUrlChange = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => setPrUrl(event.target.value),
    [],
  )

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    // Built as a union rather than spread from state: the server rejects a
    // body carrying both, and this makes that shape unwritable.
    onSubmit(
      sourceKind === 'diff'
        ? { requirementText, diffText }
        : { requirementText, prUrl },
    )
  }

  return (
    <section className="analysis-form-section" aria-labelledby="analysis-title">
      <header className="section-heading">
        <p className="eyebrow">Pre-merge check</p>
        <h1 id="analysis-title">Trace the gap between the spec and the change.</h1>
        <p>
          Submit acceptance criteria and the code change. Each verdict will cite the diff
          evidence it used.
        </p>
      </header>

      <form className="analysis-form" onSubmit={handleSubmit}>
        <fieldset>
          <legend className="visually-hidden">Requirement</legend>
          <h2 className="fieldset-title">Requirement</h2>
          <section className="field">
            <label htmlFor="requirement-text">Acceptance criteria or requirement text</label>
            <LineNumberedTextarea
              id="requirement-text"
              value={requirementText}
              onChange={handleRequirementChange}
              placeholder="Paste a ticket, Gherkin scenario, or acceptance criteria..."
              rows={9}
              required
            />
            <p className="field-help">
              Atomic, independently verifiable criteria produce the clearest report.
            </p>
          </section>
        </fieldset>

        <CodeSourceFields
          kind={sourceKind}
          diffText={diffText}
          prUrl={prUrl}
          onKindChange={setSourceKind}
          onDiffTextChange={handleDiffChange}
          onPrUrlChange={handlePrUrlChange}
        />

        <footer className="form-footer">
          <p>Your source text is evaluated server-side; API keys never reach this browser.</p>
          <button type="submit" disabled={submitting}>
            {submitting ? 'Analysing criteria…' : 'Run analysis'}
          </button>
        </footer>
      </form>
    </section>
  )
}
