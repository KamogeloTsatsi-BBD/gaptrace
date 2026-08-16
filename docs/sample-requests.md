# Sample analyses — 10 public PRs

Ten real, public pull requests for trying gaptrace out.

**In the app:** copy a criteria block into step 1, paste the PR link into step 2,
and run it. **Against the API:** each sample also carries the equivalent `curl`,
which you can import into Postman via *Import → Raw text*.

Every URL and body here has been verified: the diff fetches as `text/plain`
through `server/src/sources/codeSource.ts`, and the criteria were written against
the actual diff contents, not guessed from the title. Last re-checked 16 August
2026 — all ten still resolve at the sizes listed.

They are ordered by diff size (461 → ~21,000 characters) and chosen to vary in
the *kind* of judgement required — a dependency bump where almost everything
should come back `full`, a one-line deletion that should generate a lot of
feedback, a CI change where the interesting criteria are about what is
**absent**. Each set deliberately mixes criteria the diff clearly satisfies,
criteria it plausibly misses, and at least one that no diff can settle.

> The criteria avoid apostrophes ("does not" rather than "doesn't") so the `curl`
> bodies survive shell single quotes. Typing into the app has no such limit.

---

## 1. got#2200 — 461 chars, 1 file

A single deleted line: a `decodeURI(urlString)` call whose result was thrown
away. Tiny diff, heavy feedback — most of the criteria ask about the validation
that call may have been doing implicitly.

`https://github.com/sindresorhus/got/pull/2200`

```text
The URL setter must not perform work whose result is discarded.
Setting a URL containing percent-encoded characters must continue to produce the same resulting url value.
A malformed percent-encoded URL must be rejected with a clear error rather than silently accepted.
Handling of the unix socket protocol must be unchanged.
The change must be covered by a regression test.
```

<details><summary>curl</summary>

```bash
curl --location 'http://localhost:3000/api/analyses' --header 'Content-Type: application/json' --data '{"requirementText":"The URL setter must not perform work whose result is discarded.\nSetting a URL containing percent-encoded characters must continue to produce the same resulting url value.\nA malformed percent-encoded URL must be rejected with a clear error rather than silently accepted.\nHandling of the unix socket protocol must be unchanged.\nThe change must be covered by a regression test.","prUrl":"https://github.com/sindresorhus/got/pull/2200"}'
```

</details>

## 2. facebook/react#28000 — 1,508 chars, 1 file

Test-only modernisation: `ReactDOM.render` to `createRoot` plus `act`. Should
come back almost entirely `full` — the low-feedback end of the range.

`https://github.com/facebook/react/pull/28000`

```text
The test must use the createRoot client API instead of the legacy ReactDOM.render entry point.
Every render in the test must be wrapped in act so updates are flushed before assertions run.
The test must still cover multiple renderers updating independently.
No production source file may change as part of this migration.
The migration must not reduce assertion coverage.
```

<details><summary>curl</summary>

```bash
curl --location 'http://localhost:3000/api/analyses' --header 'Content-Type: application/json' --data '{"requirementText":"The test must use the createRoot client API instead of the legacy ReactDOM.render entry point.\nEvery render in the test must be wrapped in act so updates are flushed before assertions run.\nThe test must still cover multiple renderers updating independently.\nNo production source file may change as part of this migration.\nThe migration must not reduce assertion coverage.","prUrl":"https://github.com/facebook/react/pull/28000"}'
```

</details>

## 3. django/django#17000 — 1,567 chars, 4 files

A minimum-dependency bump that has to land in four places at once. Tests
whether the comparator tracks one requirement across metadata, test pins, docs
and release notes.

`https://github.com/django/django/pull/17000`

```text
The minimum supported asgiref version must be raised to 3.7.0 in the package metadata.
The test requirements must pin the same minimum version.
The contributing documentation that lists test dependencies must state the new minimum.
The change must be recorded in the release notes for the upcoming version.
Any code that relies on behaviour only present in the new asgiref version must be covered by a test.
```

<details><summary>curl</summary>

```bash
curl --location 'http://localhost:3000/api/analyses' --header 'Content-Type: application/json' --data '{"requirementText":"The minimum supported asgiref version must be raised to 3.7.0 in the package metadata.\nThe test requirements must pin the same minimum version.\nThe contributing documentation that lists test dependencies must state the new minimum.\nThe change must be recorded in the release notes for the upcoming version.\nAny code that relies on behaviour only present in the new asgiref version must be covered by a test.","prUrl":"https://github.com/django/django/pull/17000"}'
```

</details>

## 4. nodejs/node#50000 — 2,460 chars, 4 files

Bumps a pinned GitHub Action SHA across four workflows. Supply-chain framing —
the last criterion is about the actions this PR did *not* touch.

`https://github.com/nodejs/node/pull/50000`

```text
Every workflow that uses the upload-artifact action must be updated to the new version.
Actions must remain pinned by full commit SHA rather than by a floating tag.
The version comment beside each pin must match the SHA it documents.
No workflow trigger or permission may change as part of this bump.
All other third-party actions used in these workflows must also be pinned by commit SHA.
```

<details><summary>curl</summary>

```bash
curl --location 'http://localhost:3000/api/analyses' --header 'Content-Type: application/json' --data '{"requirementText":"Every workflow that uses the upload-artifact action must be updated to the new version.\nActions must remain pinned by full commit SHA rather than by a floating tag.\nThe version comment beside each pin must match the SHA it documents.\nNo workflow trigger or permission may change as part of this bump.\nAll other third-party actions used in these workflows must also be pinned by commit SHA.","prUrl":"https://github.com/nodejs/node/pull/50000"}'
```

</details>

## 5. honojs/hono#2500 — 2,684 chars, 3 files

A TypeScript inference fix applied to both the main source and the vendored
Deno copy, with a type-level test. Good check of whether a duplicated edit is
noticed.

`https://github.com/honojs/hono/pull/2500`

```text
When a json validator does not declare an explicit input type, the inferred input must fall back to the validated output type.
The same fix must be applied to the Deno distribution copy of the validator.
The new inference behaviour must be covered by a type-level test.
Inference for non-json validation targets must be left unchanged.
Runtime validation behaviour must be unchanged.
```

<details><summary>curl</summary>

```bash
curl --location 'http://localhost:3000/api/analyses' --header 'Content-Type: application/json' --data '{"requirementText":"When a json validator does not declare an explicit input type, the inferred input must fall back to the validated output type.\nThe same fix must be applied to the Deno distribution copy of the validator.\nThe new inference behaviour must be covered by a type-level test.\nInference for non-json validation targets must be left unchanged.\nRuntime validation behaviour must be unchanged.","prUrl":"https://github.com/honojs/hono/pull/2500"}'
```

</details>

## 6. axios/axios#5919 — 4,590 chars, 3 files

Rewrites adapter resolution to collect and report every rejection reason.
Squarely an `error_handling` diff — one criterion about error codes should come
back as a genuine gap.

`https://github.com/axios/axios/pull/5919`

```text
When no adapter is suitable, the thrown error must list every adapter that was rejected and the reason for each.
An unknown adapter name must raise an error that names the offending adapter.
Every failure path must throw an AxiosError rather than a bare Error or TypeError.
Every thrown error must carry a stable machine-readable error code.
Calling the resolver with an empty adapter list must produce a clear message rather than a generic failure.
The new behaviour must be covered by tests.
```

<details><summary>curl</summary>

```bash
curl --location 'http://localhost:3000/api/analyses' --header 'Content-Type: application/json' --data '{"requirementText":"When no adapter is suitable, the thrown error must list every adapter that was rejected and the reason for each.\nAn unknown adapter name must raise an error that names the offending adapter.\nEvery failure path must throw an AxiosError rather than a bare Error or TypeError.\nEvery thrown error must carry a stable machine-readable error code.\nCalling the resolver with an empty adapter list must produce a clear message rather than a generic failure.\nThe new behaviour must be covered by tests.","prUrl":"https://github.com/axios/axios/pull/5919"}'
```

</details>

## 7. vitejs/vite#15000 — 7,358 chars, 10 files

A sass URL-rebasing bugfix plus playground fixtures. The last criterion asks
about less and stylus, which the diff does not touch — expect a gap.

`https://github.com/vitejs/vite/pull/15000`

```text
Urls inside an imported sass partial must resolve through the configured resolver before falling back to plain path resolution.
The rebase helper must receive the resolver from its caller rather than importing one directly.
Url rewriting must remain correct now that resolution is asynchronous.
Urls starting with a slash or with a sass variable must still be left untouched.
The fix must be covered by a playground test.
The same resolution fix must be applied to the less and stylus preprocessors.
```

<details><summary>curl</summary>

```bash
curl --location 'http://localhost:3000/api/analyses' --header 'Content-Type: application/json' --data '{"requirementText":"Urls inside an imported sass partial must resolve through the configured resolver before falling back to plain path resolution.\nThe rebase helper must receive the resolver from its caller rather than importing one directly.\nUrl rewriting must remain correct now that resolution is asynchronous.\nUrls starting with a slash or with a sass variable must still be left untouched.\nThe fix must be covered by a playground test.\nThe same resolution fix must be applied to the less and stylus preprocessors.","prUrl":"https://github.com/vitejs/vite/pull/15000"}'
```

</details>

## 8. pallets/flask#5000 — 9,286 chars, 6 files

Adds a CI workflow and Dockerfile for the tutorial example. The interesting
criteria are about hardening the workflow, which it does not do.

`https://github.com/pallets/flask/pull/5000`

```text
The tutorial example must build and run its tests in CI on every pull request to the main branch.
Linting must run before the test step.
The Docker image must be built in a job separate from the test job so build artefacts do not taint it.
The workflow must also be runnable manually.
The new workflow must pin third-party actions by commit SHA.
The new workflow must not be granted access to publishing secrets.
```

<details><summary>curl</summary>

```bash
curl --location 'http://localhost:3000/api/analyses' --header 'Content-Type: application/json' --data '{"requirementText":"The tutorial example must build and run its tests in CI on every pull request to the main branch.\nLinting must run before the test step.\nThe Docker image must be built in a job separate from the test job so build artefacts do not taint it.\nThe workflow must also be runnable manually.\nThe new workflow must pin third-party actions by commit SHA.\nThe new workflow must not be granted access to publishing secrets.","prUrl":"https://github.com/pallets/flask/pull/5000"}'
```

</details>

## 9. gitlab-org/cli!1000 — 15,408 chars — **GitLab**

The only GitLab merge request in the set, so it also exercises the second URL
pattern. Adds a `ci get` command in Go with new API helpers.

`https://gitlab.com/gitlab-org/cli/-/merge_requests/1000`

```text
Users must be able to fetch a single pipeline by its id from the command line.
The new command must be registered under the existing ci command group.
Pipeline variables must be retrievable alongside the pipeline itself.
Every new API helper must return errors to its caller rather than exiting the process.
Command output must be available as JSON so it can be consumed by scripts.
The new command must have test coverage.
```

<details><summary>curl</summary>

```bash
curl --location 'http://localhost:3000/api/analyses' --header 'Content-Type: application/json' --data '{"requirementText":"Users must be able to fetch a single pipeline by its id from the command line.\nThe new command must be registered under the existing ci command group.\nPipeline variables must be retrievable alongside the pipeline itself.\nEvery new API helper must return errors to its caller rather than exiting the process.\nCommand output must be available as JSON so it can be consumed by scripts.\nThe new command must have test coverage.","prUrl":"https://gitlab.com/gitlab-org/cli/-/merge_requests/1000"}'
```

</details>

## 10. vercel/next.js#58000 — 20,933 chars, 16 files

The largest in the set: a docs edit plus an entire new example application.
Broad, shallow diff — a good test of whether evidence stays specific when there
is a lot of it.

`https://github.com/vercel/next.js/pull/58000`

```text
The custom cache handler documentation must point readers at a working example rather than describing the approach abstractly.
The example must include everything needed to run it locally, including its container setup.
The example must not commit build output or installed dependencies.
The example must document the environment variables it requires.
A cache handler failure must degrade gracefully rather than crashing the application.
The example must be covered by an automated test.
```

<details><summary>curl</summary>

```bash
curl --location 'http://localhost:3000/api/analyses' --header 'Content-Type: application/json' --data '{"requirementText":"The custom cache handler documentation must point readers at a working example rather than describing the approach abstractly.\nThe example must include everything needed to run it locally, including its container setup.\nThe example must not commit build output or installed dependencies.\nThe example must document the environment variables it requires.\nA cache handler failure must degrade gracefully rather than crashing the application.\nThe example must be covered by an automated test.","prUrl":"https://github.com/vercel/next.js/pull/58000"}'
```

</details>

---

## Coverage

| # | PR | Chars | Files | Shape |
| --- | --- | --- | --- | --- |
| 1 | got#2200 | 461 | 1 | one deleted line, maximal feedback |
| 2 | react#28000 | 1,508 | 1 | test-only, minimal feedback |
| 3 | django#17000 | 1,567 | 4 | one change across four files |
| 4 | node#50000 | 2,460 | 4 | supply chain / pinning |
| 5 | hono#2500 | 2,684 | 3 | types, duplicated edit |
| 6 | axios#5919 | 4,590 | 3 | error handling |
| 7 | vite#15000 | 7,358 | 10 | bugfix + fixtures |
| 8 | flask#5000 | 9,286 | 6 | CI, gaps by omission |
| 9 | gitlab cli!1000 | 15,408 | 12 | GitLab, new Go command |
| 10 | next#58000 | 20,933 | 16 | broad, shallow, docs + example |

Running all ten seeds `GET /api/insights` with enough spread for the gaps
dashboard to be worth looking at — the `error_handling`, `permissions` and
`validation` categories should all be represented.

The comparator caps diffs at 300,000 characters, so all ten are comfortably
inside the limit; the cap itself is best tested by pointing at a very large PR
and checking for a clean `source_unavailable`.
