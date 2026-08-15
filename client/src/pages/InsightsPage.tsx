import { useEffect } from 'react'
import { InsightsView } from '../components/insights/InsightsView'
import { useInsights } from '../hooks/useInsights'
import { useAuth } from '../auth/useAuth'

/**
 * Default-exported so the shell can `lazy()` this route. Most sessions never
 * open the dashboard, so there is no reason for it to be in the form's chunk.
 */
export default function InsightsPage() {
  const { accessToken } = useAuth()
  const { data, loading, error, generating, generateError, load, generate } = useInsights(accessToken)

  useEffect(() => {
    // `load` is free server-side and self-deduplicating, so an effect is the
    // right place for it. Generating a narrative is not, and never runs here.
    void load()
  }, [load])

  return (
    <InsightsView
      data={data}
      loading={loading}
      error={error}
      generating={generating}
      generateError={generateError}
      onGenerate={generate}
    />
  )
}
