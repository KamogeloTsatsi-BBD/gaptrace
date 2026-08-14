import type { AnalysisStatus } from '../types';

const labels: Record<AnalysisStatus, string> = { full: 'Full', partial: 'Partial', missing: 'Missing', needs_review: 'Needs review' };

export function StatusBadge({ status }: { status: AnalysisStatus }) {
  return <span className={`status status--${status}`}>{labels[status]}</span>;
}
