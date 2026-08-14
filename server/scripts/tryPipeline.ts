/**
 * Hand-test the parse -> compare steps against a requirement/diff pair.
 *
 *   npm run try                          # built-in sample pair
 *   npm run try -- req.txt diff.patch    # your own files
 *
 * Prints the parsed criteria and each verdict, so you can iterate on the
 * prompts until the output is reliable.
 */
import 'dotenv/config'
import { readFileSync } from 'node:fs'
import { parseRequirement } from '../src/services/requirementParser.js'
import { compareAll } from '../src/services/groundedComparator.js'

const SAMPLE_REQUIREMENT = `As a user I want to reset my password by email.

Acceptance criteria:
- A user can request a reset link from the login page.
- The reset link expires after 1 hour.
- The endpoint is rate-limited to 5 requests per hour per email address.
- Submitting an unknown email returns the same response as a known one.
- The reset flow should feel fast and intuitive.`

const SAMPLE_DIFF = `diff --git a/src/routes/auth.js b/src/routes/auth.js
index 1a2b3c4..5d6e7f8 100644
--- a/src/routes/auth.js
+++ b/src/routes/auth.js
@@ -12,6 +12,22 @@ router.post('/login', async (req, res) => {
   res.json({ token })
 })

+router.post('/password-reset', async (req, res) => {
+  const { email } = req.body
+  const user = await users.findByEmail(email)
+
+  if (user) {
+    const token = crypto.randomBytes(32).toString('hex')
+    await resetTokens.create({
+      userId: user.id,
+      token,
+      expiresAt: new Date(Date.now() + 60 * 60 * 1000),
+    })
+    await mailer.sendResetLink(email, token)
+  }
+
+  res.json({ ok: true })
+})
+
 module.exports = router
`

const [requirementPath, diffPath] = process.argv.slice(2)
const requirementText = requirementPath ? readFileSync(requirementPath, 'utf8') : SAMPLE_REQUIREMENT
const diffText = diffPath ? readFileSync(diffPath, 'utf8') : SAMPLE_DIFF

const criteria = await parseRequirement(requirementText)
console.log(`\nParsed ${criteria.length} criteria:\n`)
for (const criterion of criteria) {
  console.log(`  ${criterion.id}. [${criterion.verifiable ? 'verifiable' : 'not verifiable'}] ${criterion.text}`)
}

const evaluated = await compareAll(criteria, diffText)
console.log('\nVerdicts:\n')
for (const criterion of evaluated) {
  const evidence =
    criterion.evidence === 'none'
      ? 'none'
      : criterion.evidence.map((hunk) => `${hunk.file}:${hunk.lines}`).join(', ')

  console.log(`  ${criterion.id}. ${criterion.status.toUpperCase()} (${criterion.confidence})`)
  console.log(`     ${criterion.text}`)
  console.log(`     ${criterion.reason}`)
  console.log(`     evidence: ${evidence}`)
  if (criterion.category) console.log(`     category: ${criterion.category}`)
  console.log()
}
