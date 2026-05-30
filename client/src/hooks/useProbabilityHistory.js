import { useEffect, useState } from 'react'
import BASE_URL from '../api'

const HISTORY_REFRESH_MS = 3000

function getMarketId(questionMarket) {
  if (!questionMarket) {
    return null
  }

  if (typeof questionMarket === 'object') {
    return questionMarket.id
  }

  return questionMarket
}

export function useProbabilityHistory(questionMarket) {
  const marketId = getMarketId(questionMarket)
  const [series, setSeries] = useState([])
  const [loading, setLoading] = useState(Boolean(marketId))
  const [error, setError] = useState('')
  const [updatedAt, setUpdatedAt] = useState(0)

  useEffect(() => {
    if (!marketId) {
      return undefined
    }

    const controller = new AbortController()

    async function fetchHistory({ showLoading = false } = {}) {
      if (showLoading) {
        setLoading(true)
      }

      try {
        const res = await fetch(`${BASE_URL}/api/markets/${marketId}/history`, {
          signal: controller.signal,
        })

        if (!res.ok) {
          throw new Error('Unable to load probability history')
        }

        const data = await res.json()
        setSeries(Array.isArray(data.series) ? data.series : [])
        setError('')
        setUpdatedAt(Date.now())
      } catch (err) {
        if (err.name === 'AbortError') {
          return
        }

        setSeries([])
        setError('Unable to load probability history.')
      } finally {
        setLoading(false)
      }
    }

    fetchHistory({ showLoading: true })
    const intervalId = window.setInterval(fetchHistory, HISTORY_REFRESH_MS)

    return () => {
      controller.abort()
      window.clearInterval(intervalId)
    }
  }, [marketId])

  return {
    series: marketId ? series : [],
    loading: marketId ? loading : false,
    error: marketId ? error : '',
    updatedAt: marketId ? updatedAt : 0,
  }
}
