import { useEffect, useState } from 'react'
import BASE_URL from '../api'
import { formatTimeRemaining } from '../utils/formatTime'

function computeStatus(position) {
  if (position.winning_option_id) {
    return position.winning_option_id === position.id_option ? 'Won' : 'Lost'
  }
  if (position.status === 'closed') return 'Closed'
  if (Date.parse(position.closes_at) <= Date.now()) return 'Expired'
  return 'Open'
}

function formatDate(iso) {
  return new Date(iso).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

function PortfolioPage({ session }) {
  const [positions, setPositions] = useState([])

  useEffect(() => {
    fetch(`${BASE_URL}/api/portfolio`, {
      headers: { Authorization: `Bearer ${session.token}` },
    })
      .then((res) => res.json())
      .then((data) => setPositions(data.positions || []))
  }, [session.token])

  const totalStaked = positions.reduce((sum, p) => sum + p.amount, 0)

  return (
    <section className="markets-layout" aria-labelledby="portfolio-title">
      <div className="section-heading">
        <p className="eyebrow">Your positions</p>
        <h1 id="portfolio-title">Portfolio</h1>
        <p className="portfolio-meta">
          {positions.length} {positions.length === 1 ? 'position' : 'positions'}
          {' · '}
          ${totalStaked.toLocaleString()} staked
        </p>
      </div>

      <div className="portfolio-list">
        {positions.map((position) => {
          const status = computeStatus(position)
          const closed = status !== 'Open'
          return (
            <article className="portfolio-card" key={position.id_bet}>
              <header className="portfolio-card-head">
                <h2>{position.market_name}</h2>
                <span className={`portfolio-status status-${status.toLowerCase()}`}>
                  {status}
                </span>
              </header>

              <p className="portfolio-description">{position.description}</p>

              <div className="portfolio-stats">
                <div>
                  <span>Pick</span>
                  <strong>{position.option_label}</strong>
                </div>
                <div>
                  <span>Amount</span>
                  <strong>${position.amount.toLocaleString()}</strong>
                </div>
                <div>
                  <span>Placed</span>
                  <strong>{formatDate(position.created_at)}</strong>
                </div>
                <div>
                  <span>{closed ? 'Closed' : 'Closes in'}</span>
                  <strong>
                    {closed
                      ? formatDate(position.closes_at)
                      : formatTimeRemaining(position.closes_at)}
                  </strong>
                </div>
              </div>
            </article>
          )
        })}
      </div>

      {positions.length === 0 && (
        <p className="empty-results">You have not placed any bets yet.</p>
      )}
    </section>
  )
}

export default PortfolioPage
