const labels = { full: 'Full', partial: 'Partial', missing: 'Missing', needs_review: 'Needs review' };

export function StatusBadge({ status }) {
  return <span className={`status status--${status}`}>{labels[status] ?? status}</span>;
}
