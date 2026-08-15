import { STATUS_LABELS } from '../../lib/format'
import type { CriterionStatus } from '../../types/domain'

export function StatusBadge({ status }: { status: CriterionStatus }) {
  return <span className={`status status--${status}`}>{STATUS_LABELS[status]}</span>
}
