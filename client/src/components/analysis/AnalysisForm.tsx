import { useCallback, useState, type ChangeEvent, type FormEvent } from 'react'
import { CodeSourceFields, type CodeSourceKind } from './CodeSourceFields'
import { LineNumberedTextarea } from '../ui/LineNumberedTextarea'
import type { CreateAnalysisRequest } from '../../types/api'

interface AnalysisFormProps {
  onSubmit: (body: CreateAnalysisRequest) => void
  submitting: boolean
}

/**
 * Owns the draft the user is composing, and nothing else. It hands up a
 * request body, never a network call — so it renders identically whether the
 * API is live, stubbed, or absent.
 */
export function AnalysisForm({ onSubmit, submitting }: AnalysisFormProps) {
  const [sourceKind, setSourceKind] = useState<CodeSourceKind>('diff')
  const [requirementText, setRequirementText] = useState('')
  const [diffText, setDiffText] = useState('')
  const [prUrl, setPrUrl] = useState('')

  // Stable identities: the textareas below are memoised, and a fresh arrow on
  // every keystroke would defeat that on the very component it matters for.
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
    // The server rejects a body carrying both, so the union is built here
    // rather than spread from state — the type makes the wrong shape
    // unwritable instead of leaving it to a runtime 400.
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
