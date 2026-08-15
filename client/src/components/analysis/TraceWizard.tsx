import { useCallback, useState, type ChangeEvent, type FormEvent } from 'react'
import type { CreateAnalysisRequest } from '../../types/api'

const SAMPLE_SPEC = `As a user, I want to be able to reset my password so that I can regain access to my account if I forget my credentials.

Acceptance Criteria:
1. User can request a password reset from the login page
2. System sends a reset link to the registered email address
3. Reset link expires after 24 hours
4. User can set a new password that meets complexity requirements
5. User is redirected to login page after successful reset`

const SAMPLE_DIFF = `diff --git a/src/auth/login.ts b/src/auth/login.ts
index 1234567..abcdefg 100644
--- a/src/auth/login.ts
+++ b/src/auth/login.ts
@@ -15,6 +15,10 @@ export function login(email: string, password: string) {
   }
 
   if (!user) {
+    // TODO: implement password reset request
+    throw new Error('Invalid credentials')
     throw new Error('User not found')
   }
 
   return generateSession(user)
 
diff --git a/src/auth/reset.ts b/src/auth/reset.ts
new file mode 100644
index 0000000..1234567
--- /dev/null
+++ b/src/auth/reset.ts
@@ -0,0 +1,24 @@
+export async function requestPasswordReset(email: string) {
+  const user = await findUserByEmail(email)
+  if (!user) return
+
+  const token = generateResetToken()
+  await saveResetToken(user.id, token)
+
+  await sendEmail({
+    to: user.email,
+    subject: 'Password reset',
+    body: resetLinkTemplate(token),
+  })
+}`

interface TraceWizardProps {
  onSubmit: (body: CreateAnalysisRequest) => void
  submitting: boolean
}

type CodeSourceKind = 'diff' | 'pr'

export function TraceWizard({ onSubmit, submitting }: TraceWizardProps) {
  const [currentStep, setCurrentStep] = useState(1)
  const [requirementText, setRequirementText] = useState('')
  const [codeSourceType, setCodeSourceType] = useState<CodeSourceKind>('diff')
  const [diffText, setDiffText] = useState('')
  const [prUrl, setPrUrl] = useState('')

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

  const canProceedStep1 = requirementText.trim().length > 0
  const canProceedStep2 =
    codeSourceType === 'diff' ? diffText.trim().length > 0 : prUrl.trim().length > 0

  function goToStep(step: number) {
    setCurrentStep(step)
  }

  function handleNext() {
    if (currentStep === 1 && canProceedStep1) setCurrentStep(2)
    else if (currentStep === 2 && canProceedStep2) setCurrentStep(3)
  }

  function handleBack() {
    if (currentStep === 2) setCurrentStep(1)
    else if (currentStep === 3) setCurrentStep(2)
  }

  function handleRunTrace(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    onSubmit(
      codeSourceType === 'diff'
        ? { requirementText, diffText }
        : { requirementText, prUrl },
    )
  }

  return (
    <section className="wizard" aria-labelledby="wizard-title">
      <header className="section-heading">
        <p className="eyebrow">Pre-merge check</p>
        <h1 id="wizard-title">Trace the gap between the spec and the change.</h1>
        <p>Follow the steps to submit acceptance criteria and the code change for analysis.</p>
      </header>

      <ol className="wizard-progress" aria-label="Wizard progress">
        <li className={`wizard-step ${currentStep === 1 ? 'wizard-step--active' : ''} ${currentStep > 1 ? 'wizard-step--complete' : ''}`}>
          <span className="wizard-step__indicator">1</span>
          <span className="wizard-step__label">Requirement</span>
        </li>
        <li className={`wizard-step ${currentStep === 2 ? 'wizard-step--active' : ''} ${currentStep > 2 ? 'wizard-step--complete' : ''}`}>
          <span className="wizard-step__indicator">2</span>
          <span className="wizard-step__label">Code Source</span>
        </li>
        <li className={`wizard-step ${currentStep === 3 ? 'wizard-step--active' : ''}`}>
          <span className="wizard-step__indicator">3</span>
          <span className="wizard-step__label">Review &amp; Trace</span>
        </li>
      </ol>

      <form className="wizard-form" onSubmit={handleRunTrace}>
        {currentStep === 1 && (
          <fieldset className="wizard-panel">
            <legend className="visually-hidden">Requirement</legend>
            <h2 className="wizard-panel__title">Requirement</h2>
            <section className="field">
              <label htmlFor="requirement-text">Acceptance criteria or requirement text</label>
              <textarea
                id="requirement-text"
                value={requirementText}
                onChange={handleRequirementChange}
                placeholder="Paste a ticket, Gherkin scenario, or acceptance criteria..."
                className="wizard-textarea"
                required
              />
              <p className="field-help">
                Atomic, independently verifiable criteria produce the clearest report.
              </p>
            </section>
            <footer className="form-footer">
              <button type="button" onClick={() => setRequirementText(SAMPLE_SPEC)}>
                Load Sample Spec
              </button>
              <button type="button" onClick={handleNext} disabled={!canProceedStep1}>
                Next: Code Source
              </button>
            </footer>
          </fieldset>
        )}

        {currentStep === 2 && (
          <fieldset className="wizard-panel">
            <legend className="visually-hidden">Code Source</legend>
            <h2 className="wizard-panel__title">Code Source</h2>

            <section className="source-toggle" aria-label="Code source type">
              <label htmlFor="source-diff">
                <input
                  type="radio"
                  id="source-diff"
                  name="source-type"
                  value="diff"
                  checked={codeSourceType === 'diff'}
                  onChange={() => setCodeSourceType('diff')}
                />
                Paste Diff
              </label>
              <label htmlFor="source-pr">
                <input
                  type="radio"
                  id="source-pr"
                  name="source-type"
                  value="pr"
                  checked={codeSourceType === 'pr'}
                  onChange={() => setCodeSourceType('pr')}
                />
                Public PR / MR Link
              </label>
            </section>

            {codeSourceType === 'diff' ? (
              <section className="field">
                <label htmlFor="diff-text">Unified diff</label>
                <textarea
                  id="diff-text"
                  value={diffText}
                  onChange={handleDiffChange}
                  placeholder="diff --git a/... b/..."
                  className="wizard-textarea"
                  required
                />
                <p className="field-help">
                  Paste a unified diff from git or your review tool.
                </p>
                <button
                  type="button"
                  className="wizard-sample-btn"
                  onClick={() => setDiffText(SAMPLE_DIFF)}
                >
                  Load Sample Diff
                </button>
              </section>
            ) : (
              <section className="field">
                <label htmlFor="pr-url">Public GitHub or GitLab pull request URL</label>
                <input
                  id="pr-url"
                  type="url"
                  value={prUrl}
                  onChange={handlePrUrlChange}
                  placeholder="https://github.com/org/repo/pull/123"
                  className="wizard-input"
                  required
                />
                <p className="field-help">
                  Private links cannot be fetched. Paste the diff instead.
                </p>
              </section>
            )}

            <footer className="form-footer">
              <button type="button" onClick={handleBack}>
                Back
              </button>
              <button type="button" onClick={handleNext} disabled={!canProceedStep2}>
                Next: Preview
              </button>
            </footer>
          </fieldset>
        )}

        {currentStep === 3 && (
          <fieldset className="wizard-panel">
            <legend className="visually-hidden">Review &amp; Trace</legend>
            <h2 className="wizard-panel__title">Review &amp; Trace</h2>

            <div className="wizard-review-grid">
              <section className="wizard-review-col">
                <header className="wizard-review-header">
                  <h3>Requirement</h3>
                  <button type="button" className="text-button" onClick={() => goToStep(1)}>
                    Edit
                  </button>
                </header>
                <pre className="wizard-review-preview">
                  <code>{requirementText || 'No requirement text entered.'}</code>
                </pre>
              </section>

              <section className="wizard-review-col">
                <header className="wizard-review-header">
                  <h3>Code Source</h3>
                  <button type="button" className="text-button" onClick={() => goToStep(2)}>
                    Edit
                  </button>
                </header>
                <pre className="wizard-review-preview">
                  <code>
                    {codeSourceType === 'diff' ? (diffText || 'No diff entered.') : (prUrl || 'No PR link entered.')}
                  </code>
                </pre>
              </section>
            </div>

            <footer className="form-footer">
              <button type="button" onClick={handleBack}>
                Back
              </button>
              <button type="submit" disabled={submitting}>
                {submitting ? 'Analysing criteria…' : 'RUN TRACE ANALYSIS'}
              </button>
            </footer>
          </fieldset>
        )}
      </form>
    </section>
  )
}
