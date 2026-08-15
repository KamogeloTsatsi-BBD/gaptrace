import type { EvidenceHunk } from '../../types/domain'

interface EvidenceListProps {
  evidence: readonly EvidenceHunk[] | 'none'
}

/** `'none'` is a real answer from the model, so it is stated, not left empty. */
export function EvidenceList({ evidence }: EvidenceListProps) {
  if (evidence === 'none' || evidence.length === 0) {
    return <p className="no-evidence">None found in this diff.</p>
  }

  return (
    <ul className="evidence-list">
      {evidence.map((hunk) => (
        <li key={`${hunk.file}:${hunk.lines}`}>
          <code>{hunk.file}</code>
          <span>lines {hunk.lines}</span>
        </li>
      ))}
    </ul>
  )
}
