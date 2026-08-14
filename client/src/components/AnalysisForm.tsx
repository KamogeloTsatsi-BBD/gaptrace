import { useState, type FormEvent } from "react";
import type { CreateAnalysisPayload } from "../types";

interface AnalysisFormProps {
  onSubmit: (payload: CreateAnalysisPayload) => void;
  submitting: boolean;
}

export function AnalysisForm({ onSubmit, submitting }: AnalysisFormProps) {
  const [sourceType, setSourceType] = useState<"diff" | "pr">("diff");
  const [requirementText, setRequirementText] = useState("");
  const [diffText, setDiffText] = useState("");
  const [prUrl, setPrUrl] = useState("");

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    onSubmit({
      requirementText,
      ...(sourceType === "diff" ? { diffText } : { prUrl }),
    });
  }

  return (
    <section className="analysis-form-section" aria-labelledby="analysis-title">
      <header className="section-heading">
        <p className="eyebrow">Pre-merge check</p>
        <h1 id="analysis-title">
          Trace the gap between the spec and the change.
        </h1>
        <p>
          Submit acceptance criteria and the code change. Each verdict will cite
          the diff evidence it used.
        </p>
      </header>
      <form className="analysis-form" onSubmit={submit}>
        <fieldset>
          <legend>Requirement</legend>
          <label htmlFor="requirement-text">
            Acceptance criteria or requirement text
          </label>
          <textarea
            id="requirement-text"
            value={requirementText}
            onChange={(event) => setRequirementText(event.target.value)}
            placeholder="Paste a ticket, Gherkin scenario, or acceptance criteria…"
            rows={9}
            required
          />
          <p className="field-help">
            Atomic, independently verifiable criteria produce the clearest
            report.
          </p>
        </fieldset>
        <fieldset>
          <legend>Code source</legend>
          <section className="source-toggle" aria-label="Code source type">
            <label>
              <input
                type="radio"
                name="source-type"
                checked={sourceType === "diff"}
                onChange={() => setSourceType("diff")}
              />{" "}
              Paste diff
            </label>
            <label>
              <input
                type="radio"
                name="source-type"
                checked={sourceType === "pr"}
                onChange={() => setSourceType("pr")}
              />{" "}
              Public PR or MR link
            </label>
          </section>
          {sourceType === "diff" ? (
            <label htmlFor="diff-text">
              Unified diff
              <textarea
                id="diff-text"
                value={diffText}
                onChange={(event) => setDiffText(event.target.value)}
                placeholder="diff --git a/... b/..."
                rows={12}
                required
              />
            </label>
          ) : (
            <label htmlFor="pr-url">
              Public GitHub or GitLab pull request URL
              <input
                id="pr-url"
                type="url"
                value={prUrl}
                onChange={(event) => setPrUrl(event.target.value)}
                placeholder="https://github.com/org/repo/pull/123"
                required
              />
              <span className="field-help">
                Private links cannot be fetched. Paste the diff instead.
              </span>
            </label>
          )}
        </fieldset>
        <footer className="form-footer">
          <p>
            Your source text is evaluated server-side; API keys never reach this
            browser.
          </p>
          <button type="submit" disabled={submitting}>
            {submitting ? "Analysing criteria…" : "Run analysis"}
          </button>
        </footer>
      </form>
    </section>
  );
}
