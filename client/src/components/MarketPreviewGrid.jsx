import { useEffect, useState } from 'react'
import BASE_URL from '../api'
import { formatTimeRemaining } from '../utils/formatTime'

function MarketPreviewGrid({ actionLabel, onPlaceBet, searchTerm, previewLimit, title = 'Campus market preview' }) {
  const [markets, setMarkets] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    fetch(`${BASE_URL}/api/markets?status=open`)
      .then((res) => {
        if (!res.ok) {
          throw new Error('Market request failed')
        }
        return res.json()
      })
      .then((data) => {
        setMarkets(data.markets || [])
        setError('')
      })
      .catch(() => {
        setMarkets([])
        setError('Unable to load markets. Please try again later.')
      })
      .finally(() => setLoading(false))
  }, [])

  const normalizedSearch = searchTerm.trim().toLowerCase()
  const filtered = normalizedSearch
    ? markets.filter((market) =>
        market.market_name.toLowerCase().includes(normalizedSearch),
      )
    : markets
  const filteredMarkets = previewLimit ? filtered.slice(0, previewLimit) : filtered

  if (loading) return <p className="empty-results">Loading markets...</p>
  if (error) return <p className="empty-results">{error}</p>

  return (
    <section className="markets-layout" aria-labelledby="markets-title">
      <div className="section-heading">
        <p className="eyebrow">Active markets</p>
        <h1 id="markets-title">{title}</h1>
      </div>

      <div className="market-grid">
        {filteredMarkets.map((market) => (
          <article className="market-card" key={market.id}>
            <h2>{market.market_name}</h2>
            <dl>
              <div>
                <dt>Closes</dt>
                <dd>{formatTimeRemaining(market.closes_at)}</dd>
              </div>
            </dl>
            <button
              className="market-action"
              type="button"
              onClick={onPlaceBet}
            >
              {actionLabel}
            </button>
          </article>
        ))}
      </div>

      {previewLimit && filtered.length > previewLimit && (
        <p className="empty-results">Sign up to see all {filtered.length} markets.</p>
      )}

      {filteredMarkets.length === 0 && (
        <p className="empty-results">No open markets right now.</p>
      )}
    </section>
  )
}

export default MarketPreviewGrid
