export const exampleReport = {
  id: 'demo-report',
  created_at: '2026-08-14T09:30:00Z',
  pr_reference: 'https://github.com/acme/portal/pull/184',
  requirement_text: 'Users can reset their password by email. Validate the email address and rate-limit reset requests.',
  criteria: [
    { id: '1', criterion_text: 'Users can reset their password by email.', verifiable: true, status: 'full', reason: 'The reset request endpoint generates a token and sends an email.', evidence: [{ file: 'src/routes/passwordReset.ts', lines: '18–56' }], confidence: 0.93, category: null },
    { id: '2', criterion_text: 'The email address is validated before a reset request.', verifiable: true, status: 'partial', reason: 'The endpoint checks for a present value, but does not validate email format.', evidence: [{ file: 'src/routes/passwordReset.ts', lines: '21–25' }], confidence: 0.88, category: 'validation' },
    { id: '3', criterion_text: 'Password-reset requests are rate-limited.', verifiable: true, status: 'missing', reason: 'No rate-limit middleware or request-throttling logic appears in the supplied diff.', evidence: 'none', confidence: 0.91, category: 'performance' },
  ],
};
