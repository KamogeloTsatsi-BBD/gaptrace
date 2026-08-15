import { useEffect } from 'react'
import { InsightsView } from '../components/insights/InsightsView'
import { useInsights } from '../hooks/useInsights'
import { useAuth } from '../auth/useAuth'
import { exampleInsights } from '../data/exampleInsights'

/**
 * Default-exported so the shell can `lazy()` this route. The insights bundle
 * carries the dashboard and its example data, and most sessions never open it
 * — there is no reason for it to be in the chunk that renders the form.
 */
export default function InsightsPage() {
  const { accessToken, configured } = useAuth()
  const { data, loading, error, generating, generateError, load, generate, showExample } =
    useInsights(accessToken)

  useEffect(() => {
    // `load` is free server-side and self-deduplicating, so an effect is the
    // right place for it. Generating a narrative is not, and never runs here.
    if (configured) void load()
    else showExample(exampleInsights)
  }, [configured, load, showExample])

  return (
    <InsightsView
      data={data}
      loading={loading}
      error={error}
      generating={generating}
      generateError={generateError}
      onGenerate={configured ? generate : undefined}
    />
  )
}
