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

function getMarketLeader(options = []) {
  if (!options.length) {
    return null
  }

  return options.reduce((leader, option) => {
    const percent = Number(option.percent || 0)
    const leaderPercent = Number(leader.percent || 0)
    return percent > leaderPercent ? option : leader
  }, options[0])
}

function MarketStat({ label, value }) {
  return (
    <div className="market-stat">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  )
}

function formatOutcomeSignal(percent, pool) {
  if (pool <= 0) {
    return '-'
  }

  return `${percent}%`
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
          const options = Array.isArray(market.options) ? market.options : []
          const leader = getMarketLeader(options)
          const pool = Number(market.total_liquidity || 0)
          const betCount = Number(market.bet_count || 0)

          return (
            <article className="market-card" key={market.id}>
              <div className="market-card-topline">
                <span className="market-category">{market.category || 'Campus'}</span>
                <span className={`market-state-pill state-${market.status}`}>
                  {resultText}
                </span>
              </div>

              <div className="market-card-main">
                <h2>{market.market_name}</h2>
                {market.description && (
                  <p className="market-description">{market.description}</p>
                )}
              </div>

              <StatusBar
                options={options}
                chosenOptionId={marketStatus?.chosenOptionId}
                title={marketStatus ? 'Your market distribution' : 'Live probability'}
                showLegend={false}
              />

              <div className="market-outcome-list">
                {options.map((option) => {
                  const percent = Number(option.percent || 0)
                  const selected = option.id === marketStatus?.chosenOptionId

                  return (
                    <button
                      className={selected ? 'market-outcome selected' : 'market-outcome'}
                      disabled={!canShowAction}
                      key={option.id || option.label}
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation()
                        onButtonClick(market)
                      }}
                    >
                      <span>{option.label}</span>
                      <strong>{formatOutcomeSignal(percent, pool)}</strong>
                    </button>
                  )
                })}
              </div>

              <div className="market-stat-grid">
                <MarketStat label="Pool" value={`$${pool.toLocaleString()}`} />
                <MarketStat label="Bets" value={betCount.toLocaleString()} />
                <MarketStat
                  label="Closes"
                  value={market.status === 'open' ? formatTimeRemaining(market.closes_at) : resultText}
                />
              </div>

              {leader && (
                <p className="market-signal">
                  Leading: <strong>{leader.label}</strong>
                </p>
              )}

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

              {marketStatus && (
                <p className="market-position-note">Position placed</p>
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
