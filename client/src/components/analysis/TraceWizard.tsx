import { useCallback, useEffect, useRef, useState, type ChangeEvent, type FormEvent } from 'react'
import { CodeSourceFields, type CodeSourceKind } from './CodeSourceFields'
import { LoadingPanel } from '../ui/LoadingPanel'
import { Notice } from '../ui/Notice'
import { recoveryHint } from '../../lib/format'
import { LineNumberedTextarea } from '../ui/LineNumberedTextarea'
import type { AnalysisFailure, CreateAnalysisRequest } from '../../types/api'

const STEPS = ['Requirement', 'Code source', 'Review and trace'] as const

const ANALYSING_LINES: readonly string[] = [
  'Reading the diff…',
  'Breaking down your criteria…',
  'Matching code to criteria…',
  "Spotting what's missing…",
  'Collecting evidence…',
  'Weighing up verdicts…',
]

type Step = 1 | 2 | 3

interface TraceWizardProps {
  onSubmit: (body: CreateAnalysisRequest) => void
  submitting: boolean
  /** The last submission's failure, rendered where the user pressed the button. */
  error: AnalysisFailure | null
  onDismissError: () => void
}

/**
 * Owns the draft being composed, one step at a time. It hands up a request
 * body, never a call.
 */
export function TraceWizard({
  onSubmit,
  submitting,
  error,
  onDismissError,
}: TraceWizardProps) {
  const [step, setStep] = useState<Step>(1)
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

  const sourceValue = sourceKind === 'diff' ? diffText : prUrl
  const requirementReady = requirementText.trim() !== ''
  const sourceReady = sourceValue.trim() !== ''
  // Gates the step, so the review step can never be reached with a blank field.
  const stepComplete =
    step === 1 ? requirementReady : step === 2 ? sourceReady : requirementReady && sourceReady

  const notice = useRef<HTMLElement>(null)

  // A failure renders beside the button that caused it, but the button is at the
  // foot of a long form — without moving focus, a failed run just looks like a
  // flicker back to the review step.
  useEffect(() => {
    if (error) notice.current?.focus()
  }, [error])

  /** Any deliberate move through the wizard retires the previous failure. */
  function goToStep(next: Step) {
    if (error) onDismissError()
    setStep(next)
  }

  /** The recovery for a link the server would not take: paste the diff instead. */
  function switchToDiff() {
    setSourceKind('diff')
    goToStep(2)
  }

  /**
   * Every step submits this form, so advancing and running the analysis are one
   * path and only the last step can reach the API. Splitting them across a
   * `type="button"` and a `type="submit"` in the same slot ran the analysis on
   * arrival at step 3: React mutates `type` on the button already being clicked,
   * and the browser reads it again when it applies the click's default action.
   */
  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!stepComplete) return

    if (step < 3) {
      goToStep((step + 1) as Step)
      return
    }

    // Built as a union rather than spread from state: the server rejects a
    // body carrying both, and this makes that shape unwritable.
    onSubmit(
      sourceKind === 'diff'
        ? { requirementText, diffText }
        : { requirementText, prUrl },
    )
  }

  const forwardLabel =
    step === 1 ? 'Next: code source' : step === 2 ? 'Next: review' : 'Run analysis'

  return (
    <section className="wizard" aria-labelledby="analysis-title">
      <header className="section-heading">
        <p className="eyebrow">Pre-merge check</p>
        <h1 id="analysis-title">Trace the gap between the spec and the change.</h1>
        <p>
          Submit acceptance criteria and the code change. Each verdict will cite the diff
          evidence it used.
        </p>
      </header>

      <ol className="wizard-progress">
        {STEPS.map((label, index) => {
          const number = index + 1
          const state = number === step ? 'active' : number < step ? 'complete' : 'pending'
          return (
            <li
              key={label}
              className={`wizard-step wizard-step--${state}`}
              aria-current={number === step ? 'step' : undefined}
            >
              {/* Decorative: the label and aria-current carry the meaning. */}
              <span className="wizard-step__indicator" aria-hidden="true">
                {state === 'complete' ? '✓' : number}
              </span>
              <span className="wizard-step__label">
                {label}
                {state === 'complete' ? (
                  <span className="visually-hidden"> (completed)</span>
                ) : null}
              </span>
            </li>
          )
        })}
      </ol>

      <form className="analysis-form wizard-form" onSubmit={handleSubmit}>
        {step === 1 ? (
          <fieldset>
            <legend className="visually-hidden">Requirement</legend>
            <h2 className="fieldset-title">Requirement</h2>
            <section className="field">
              <label htmlFor="requirement-text">Acceptance criteria or requirement text</label>
              <LineNumberedTextarea
                id="requirement-text"
                value={requirementText}
                onChange={handleRequirementChange}
                placeholder="Paste a ticket, Gherkin scenario, or acceptance criteria…"
                rows={9}
                required
              />
              <p className="field-help">
                Atomic, independently verifiable criteria produce the clearest report.
              </p>
            </section>
          </fieldset>
        ) : null}

        {step === 2 ? (
          <CodeSourceFields
            kind={sourceKind}
            diffText={diffText}
            prUrl={prUrl}
            onKindChange={setSourceKind}
            onDiffTextChange={handleDiffChange}
            onPrUrlChange={handlePrUrlChange}
          />
        ) : null}

        {submitting ? (
          <LoadingPanel
            id="analysis-progress-title"
            title="Running the analysis"
            lines={ANALYSING_LINES}
          />
        ) : null}

        {step === 3 && !submitting ? (
          <fieldset>
            <legend className="visually-hidden">Review and trace</legend>
            <h2 className="fieldset-title">Review and trace</h2>

            <section className="wizard-review-grid">
              <article className="wizard-review-panel">
                <header>
                  <h3>Requirement</h3>
                  <button type="button" className="text-button" onClick={() => goToStep(1)}>
                    Edit
                  </button>
                </header>
                <pre className="wizard-review-preview">{requirementText}</pre>
              </article>

              <article className="wizard-review-panel">
                <header>
                  <h3>{sourceKind === 'diff' ? 'Unified diff' : 'Pull request link'}</h3>
                  <button type="button" className="text-button" onClick={() => goToStep(2)}>
                    Edit
                  </button>
                </header>
                <pre className="wizard-review-preview">{sourceValue}</pre>
              </article>
            </section>

            <p className="field-help">
              Your source text is evaluated server-side; API keys never reach this browser.
            </p>
          </fieldset>
        ) : null}

        {/* Persistent, so the change of text is what gets announced. */}
        <p className="visually-hidden" role="status">
          {submitting ? 'Analysing criteria…' : `Step ${step} of ${STEPS.length}.`}
        </p>

        {error && !submitting ? (
          <Notice
            ref={notice}
            tone="error"
            title="The analysis could not run."
            // Offered on what was submitted, not on the message's wording: a
            // pasted diff has no link to fall back from.
            action={
              sourceKind === 'pr' ? (
                <button type="button" onClick={switchToDiff}>
                  Paste the diff instead
                </button>
              ) : null
            }
          >
            {error.message} {recoveryHint(error.code)}
          </Notice>
        ) : null}

        {/* Gone while a run is in flight: the panel above says everything, and
            Back would invite edits to a draft already submitted. */}
        {submitting ? null : (
          <footer className="form-footer">
            {step === 1 ? null : (
              <button type="button" onClick={() => goToStep((step - 1) as Step)}>
                Back
              </button>
            )}
            <button type="submit" disabled={!stepComplete}>
              {forwardLabel}
            </button>
          </footer>
        )}
      </form>
    </section>
  )
}
