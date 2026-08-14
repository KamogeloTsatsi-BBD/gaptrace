import type { InsightsData } from '../types';

const severityLabel = { high: 'High priority', medium: 'Medium priority', low: 'Low priority' };

interface InsightsViewProps { data: InsightsData | null; loading: boolean; error: string; }
export function InsightsView({ data, loading, error }: InsightsViewProps) {
  if (loading) return <section className="empty-state"><p>Loading the evidence substrate and narrative…</p></section>;
  if (error) return <section className="empty-state"><h1>Insights are unavailable</h1><p>{error}</p></section>;
  const substrate = data?.substrate;
  return <section className="insights" aria-labelledby="insights-title"><header className="section-heading"><p className="eyebrow">Across past analyses</p><h1 id="insights-title">Patterns, grounded in delivery evidence.</h1><p>Numbers are calculated from your analyses. Likely causes are presented as hypotheses, not facts.</p></header><section className="summary" aria-label="Gap statistics"><article><strong>{substrate?.total_criteria ?? 0}</strong><span>criteria analysed</span></article><article><strong>{substrate?.gap_count ?? 0}</strong><span>gaps found</span></article><article><strong>{substrate?.gap_rate ?? 0}%</strong><span>overall gap rate</span></article></section><section className="category-breakdown" aria-labelledby="category-title"><h2 id="category-title">Gap categories</h2><ol>{(substrate?.categories ?? []).map((category) => <li key={category.category}><span>{category.category.replaceAll('_', ' ')}</span><strong>{category.gap_count} gaps · {category.gap_rate}%</strong></li>)}</ol></section><section className="narrative-list" aria-labelledby="findings-title"><h2 id="findings-title">Grounded findings</h2>{(data?.narrative ?? []).map((item) => <article className="insight-card" key={item.finding}><header><span className={`severity severity--${item.severity}`}>{severityLabel[item.severity]}</span><h3>{item.finding}</h3></header><dl><dt>Grounding statistic</dt><dd>{item.grounding_stat}</dd><dt>Hypothesis</dt><dd>{item.hypothesis}</dd><dt>Suggested action</dt><dd>{item.suggested_action}</dd></dl></article>)}</section></section>;
}
