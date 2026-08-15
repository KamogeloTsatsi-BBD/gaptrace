import { useEffect } from 'react'
import { InsightsView } from '../components/insights/InsightsView'
import { useInsights } from '../hooks/useInsights'
import { useAuth } from '../auth/useAuth'

/** Default-exported so the shell can `lazy()` it. */
export default function InsightsPage() {
  const { accessToken, configured } = useAuth()
  const { data, loading, error, generating, generateError, load, generate } =
    useInsights(accessToken)

  useEffect(() => {
    // `load` is free, so an effect is the right place. Generating never is.
    if (configured) void load()
  }, [configured, load])

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