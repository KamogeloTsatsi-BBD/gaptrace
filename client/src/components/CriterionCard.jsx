import { StatusBadge } from './StatusBadge';

function formatCategory(category) {
  return category?.replaceAll('_', ' ');
}

export function CriterionCard({ criterion, number }) {
  const evidence = criterion.evidence;
  return <article className={`criterion-card criterion-card--${criterion.status}`}>
    <header>
      <p className="criterion-number">Criterion {number}</p>
      <StatusBadge status={criterion.status} />
      <h3>{criterion.criterion_text}</h3>
    </header>
    <section aria-label="Verdict reasoning">
      <h4>Verdict</h4>
      <p>{criterion.reason}</p>
    </section>
    <section aria-label="Evidence">
      <h4>Evidence</h4>
      {evidence === 'none' || !evidence?.length ? <p className="no-evidence">None found in this diff.</p> : <ul className="evidence-list">{evidence.map((item) => <li key={`${item.file}-${item.lines}`}><code>{item.file}</code><span>lines {item.lines}</span></li>)}</ul>}
    </section>
    <footer>
      {criterion.category && <span className="category">{formatCategory(criterion.category)}</span>}
      {typeof criterion.confidence === 'number' && <span className="confidence">Confidence {Math.round(criterion.confidence * 100)}%</span>}
    </footer>
  </article>;
}
