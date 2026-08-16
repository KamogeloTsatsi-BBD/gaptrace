# gaptrace

**[gaptrace-escape-hackathon.vercel.app](https://gaptrace-escape-hackathon.vercel.app/)**

**Does the code actually do what the ticket asked for?**

gaptrace answers that one question with evidence. You give it a requirement —
a Jira ticket's acceptance criteria, a Gherkin scenario, anything written down —
and the code change that is meant to satisfy it. It splits the requirement into
individual criteria, checks each one against the diff on its own, and returns a
verdict per criterion with the diff hunks that justify it.

It is a pre-merge check for the gap between what a BA specified and what a
developer shipped, aimed at the moment before approval rather than after
release.

## The four verdicts

| Verdict | Meaning |
| --- | --- |
| **Full** | The diff implements the criterion. |
| **Partial** | The diff addresses it but leaves a real gap. |
| **Missing** | This change was expected to cover it and does not. |
| **Needs review** | Cannot be told from the diff alone. |

`Needs review` is a real answer, not a failure. A diff is a partial view of a
repository, so "I can't tell from this" is more useful than a confident wrong
verdict. Criteria that no code could settle — "the page should feel fast" — land
here too, and cost nothing to evaluate.

Every verdict cites the files and line ranges it used. Trust the evidence, not
the confidence score beside it.

## Using it

**1. Requirement.** Paste the acceptance criteria. One atomic, independently
checkable statement per line produces the clearest report; a wall of prose still
works, it just gets split up for you.

**2. Code source.** Either paste a unified diff (`git diff`) or give a link to a
public pull request or merge request:

- `https://github.com/owner/repo/pull/123`
- `https://gitlab.com/group/project/-/merge_requests/123`

Private repositories cannot be fetched — paste the diff for those.

**3. Review and trace.** Check what you are about to submit, then run it. One
model call is made per criterion, so a large requirement takes longer than a
small one; 20–30 seconds is normal.

You get a card per criterion with its verdict, a one-line reason, and the cited
evidence. Gaps are tagged by category — error handling, edge cases, permissions,
validation, data integrity, performance, UI/UX.

**Insights.** Once you have run a few analyses, the Insights tab counts the
patterns across all of them: which gap categories keep recurring, which criteria
were too vague to check. Those numbers are always free and always current. The
written findings underneath are generated on request, from a button, because
that is the one thing in the app that costs money.

## Try it on a real pull request

**[Sample analyses →](docs/sample-requests.md)** — ten public pull requests and
merge requests, each with acceptance criteria written against the actual diff.
They range from a single deleted line to a sixteen-file feature, and each set
deliberately mixes criteria the change satisfies, criteria it misses, and at
least one nothing can settle. Copy a set in, paste the link, and run it.

## Running it locally

Requires Node 22+, an Anthropic API key, and a Supabase project with the
migration in `supabase/migrations/` applied and asymmetric JWT signing keys
enabled (Auth → JWT Keys).

```bash
npm install
cp .env.example .env    # then fill in the three values
npm run dev             # API on :3000, client on :5173
```

`.env.example` documents each variable and why it is what it is. There is no
demo mode: the server will not start without Supabase, because one that booted
without a database would accept analyses, pay for them and drop them.

Other commands: `npm run typecheck`, `npm run build`,
`npm run check:pr -- <url>` (fetches a PR diff, no model call).
