import { StatusBadge } from './StatusBadge';
import type { Criterion } from '../types';

export function CriterionCard({ criterion, number }: { criterion: Criterion; number: number }) {
  const category = criterion.category?.replaceAll('_', ' ');
  return <article className={`criterion-card criterion-card--${criterion.status}`}><header><p className="criterion-number">Criterion {number}</p><StatusBadge status={criterion.status} /><h3>{criterion.criterion_text}</h3></header><section aria-label="Verdict reasoning"><h4>Verdict</h4><p>{criterion.reason}</p></section><section aria-label="Evidence"><h4>Evidence</h4>{criterion.evidence === 'none' || criterion.evidence.length === 0 ? <p className="no-evidence">None found in this diff.</p> : <ul className="evidence-list">{criterion.evidence.map((item) => <li key={`${item.file}-${item.lines}`}><code>{item.file}</code><span>lines {item.lines}</span></li>)}</ul>}</section><footer>{category && <span className="category">{category}</span>}{typeof criterion.confidence === 'number' && <span className="confidence">Confidence {Math.round(criterion.confidence * 100)}%</span>}</footer></article>;
}
