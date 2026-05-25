import { useEffect, useState } from 'react'
import BASE_URL from '../api'
import StatusBar from './StatusBar'
import { formatTimeRemaining } from '../utils/formatTime'

const MARKET_REFRESH_MS = 3000
const DEFAULT_STATUSES = ['open']

function getResultText(market) {
  if (market.status === 'expired') {
    return 'Awaiting result'
  }

  if (market.winning_option_id) {
    const winningOption = market.options?.find((option) => option.id === market.winning_option_id)
    return winningOption ? `Resolved: ${winningOption.label}` : 'Resolved'
  }

  return 'Open'
}

function MarketPreviewGrid({
  actionLabel,
  eyebrow = 'Active markets',
  emptyMessage = 'No open markets right now.',
  marketBetDist = {},
  onButtonClick,
  previewLimit,
  searchTerm,
  showActions = true,
  statuses = DEFAULT_STATUSES,
  title = 'Campus market preview',
}) {
  const [markets, setMarkets] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const statusesKey = statuses.join('|')
  const titleId = `markets-title-${statuses.join('-')}`

  useEffect(() => {
    const controller = new AbortController()
    const statusList = statusesKey.split('|')

    async function fetchMarkets({ showLoading = false } = {}) {
      if (showLoading) {
        setLoading(true)
      }

      const trimmedSearch = searchTerm.trim()

      try {
        const marketGroups = await Promise.all(
          statusList.map(async (status) => {
            const params = new URLSearchParams({ status })
            if (trimmedSearch) {
              params.set('search', trimmedSearch)
            }

            const res = await fetch(`${BASE_URL}/api/markets?${params.toString()}`, {
              signal: controller.signal,
            })

            if (!res.ok) {
              throw new Error('Market request failed')
            }

            const data = await res.json()
            return data.markets || []
          }),
        )

        const nextMarkets = marketGroups
          .flat()
          .sort((a, b) => new Date(b.closes_at) - new Date(a.closes_at))

        setMarkets(nextMarkets)
        setError('')
      } catch (err) {
        if (err.name === 'AbortError') {
          return
        }

        setMarkets([])
        setError('Unable to load markets. Please try again later.')
      } finally {
        setLoading(false)
      }
    }

    fetchMarkets({ showLoading: true })
    const intervalId = window.setInterval(fetchMarkets, MARKET_REFRESH_MS)

    return () => {
      controller.abort()
      window.clearInterval(intervalId)
    }
  }, [searchTerm, statusesKey])

  const filteredMarkets = previewLimit ? markets.slice(0, previewLimit) : markets

  if (loading) return <p className="empty-results">Loading markets...</p>
  if (error) return <p className="empty-results">{error}</p>

  return (
    <section className="markets-layout" aria-labelledby={titleId}>
      <div className="section-heading">
        <p className="eyebrow">{eyebrow}</p>
        <h1 id={titleId}>{title}</h1>
      </div>

      <div className="market-grid">
        {filteredMarkets.map((market) => {
          const marketStatus = marketBetDist[market.id]
          const resultText = getResultText(market)
          const canShowAction = showActions && !marketStatus && market.status === 'open'

          return (
            <article className="market-card" key={market.id}>
              <h2>{market.market_name}</h2>
              <dl>
                <div>
                  <dt>Closes</dt>
                  <dd>{formatTimeRemaining(market.closes_at)}</dd>
                </div>
                <div>
                  <dt>Pool</dt>
                  <dd>${Number(market.total_liquidity || 0).toLocaleString()}</dd>
                </div>
                <div>
                  <dt>Bets</dt>
                  <dd>{Number(market.bet_count || 0).toLocaleString()}</dd>
                </div>
                <div>
                  <dt>Status</dt>
                  <dd>{resultText}</dd>
                </div>
              </dl>

              <StatusBar
                options={market.options}
                chosenOptionId={marketStatus?.chosenOptionId}
                title={marketStatus ? 'Live distribution' : 'Live market distribution'}
                showLegend={false}
              />

              {canShowAction && (
                <button
                  className="market-action"
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation()
                    onButtonClick(market)
                  }}
                >
                  {actionLabel}
                </button>
              )}
            </article>
          )
        })}
      </div>

      {previewLimit && markets.length > previewLimit && (
        <p className="empty-results">Sign up to see all {markets.length} markets.</p>
      )}

      {filteredMarkets.length === 0 && (
        <p className="empty-results">{emptyMessage}</p>
      )}
    </section>
  )
}

export default MarketPreviewGrid
