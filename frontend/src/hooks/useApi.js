import { useState, useEffect, useCallback } from 'react'

export function useApi(fetcher, deps = [], options = {}) {
  const { initialData = null, refreshInterval = 0 } = options

  const [data, setData] = useState(initialData)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const fetch = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const result = await fetcher()
      setData(result.data ?? result)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, deps)  // eslint-disable-line

  useEffect(() => {
    fetch()
    if (refreshInterval > 0) {
      const id = setInterval(fetch, refreshInterval)
      return () => clearInterval(id)
    }
  }, [fetch, refreshInterval])

  return { data, loading, error, refetch: fetch }
}
