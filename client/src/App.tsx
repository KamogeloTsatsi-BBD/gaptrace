import { useState } from 'react';
import { useAuth } from './auth/AuthContext';
import { AppShell } from './components/AppShell';
import { AnalysisForm } from './components/AnalysisForm';
import { AuthForm } from './components/AuthForm';
import { InsightsView } from './components/InsightsView';
import { ReportView } from './components/ReportView';
import { exampleInsights } from './data/exampleInsights';
import { exampleReport } from './data/exampleReport';
import { analysesApi } from './lib/api';
import type { AnalysisReport, CreateAnalysisPayload, InsightsData } from './types';

function Workspace() {
  const { session, configured } = useAuth();
  const [page, setPage] = useState<'analysis' | 'insights'>('analysis');
  const [report, setReport] = useState<AnalysisReport | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [insights, setInsights] = useState<InsightsData | null>(null);
  const [insightsLoading, setInsightsLoading] = useState(false);
  const [insightsError, setInsightsError] = useState('');
  const accessToken = session?.access_token;

  async function createAnalysis(payload: CreateAnalysisPayload) {
    setSubmitting(true); setError('');
    try { setReport(await analysesApi.create(payload, accessToken)); }
    catch (requestError) { setError(requestError instanceof Error ? requestError.message : 'The analysis could not be completed.'); }
    finally { setSubmitting(false); }
  }

  async function openInsights() {
    setPage('insights');
    if (insights) return;
    setInsightsLoading(true); setInsightsError('');
    try { setInsights(await analysesApi.getInsights(accessToken)); }
    catch (requestError) { setInsightsError(requestError instanceof Error ? requestError.message : 'Insights could not be loaded.'); }
    finally { setInsightsLoading(false); }
  }

  function navigate(nextPage: 'analysis' | 'insights') { if (nextPage === 'insights') void openInsights(); else setPage(nextPage); }

  return <AppShell page={page} onNavigate={navigate}>
    {!configured && <aside className="configuration-notice"><strong>Demo configuration</strong><span>Add Supabase values to <code>.env</code> to enable email authentication. The UI uses example reports until the API is available.</span></aside>}
    {page === 'insights' && <InsightsView data={insights ?? (!configured ? exampleInsights : null)} loading={insightsLoading} error={insightsError} />}
    {page === 'analysis' && (report ? <ReportView report={report} onNewAnalysis={() => setReport(null)} /> : <>
      {error && <aside className="error-notice" role="alert"><strong>Analysis could not run.</strong><span>{error}</span>{!configured && <button type="button" onClick={() => setReport(exampleReport)}>Open an example report</button>}</aside>}
      <AnalysisForm onSubmit={createAnalysis} submitting={submitting} />
      {!configured && <section className="demo-callout"><h2>Explore the report experience</h2><p>The backend is not configured in this workspace yet.</p><button type="button" onClick={() => setReport(exampleReport)}>Open example report</button></section>}
    </>)}
  </AppShell>;
}

export default function App() {
  const { configured, session, ready } = useAuth();
  if (!ready) return <main className="loading-page">Loading gaptrace…</main>;
  if (configured && !session) return <AuthForm />;
  return <Workspace />;
}
