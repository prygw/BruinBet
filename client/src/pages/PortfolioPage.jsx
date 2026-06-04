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

function PositionCard({ position }) {
  const status = computeStatus(position)
  const closed = status !== 'Open'
  return (
    <article className="portfolio-card">
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
}

function PortfolioPage({ session }) {
  const [positions, setPositions] = useState([])
  const [error, setError] = useState('')

  useEffect(() => {
    fetch(`${BASE_URL}/api/portfolio`, {
      headers: { Authorization: `Bearer ${session.token}` },
    })
      .then((res) => {
        if (!res.ok) throw new Error('Failed to load portfolio')
        return res.json()
      })
      .then((data) => setPositions(data.positions || []))
      .catch(() => setError('Could not load your portfolio. Please try again.'))
  }, [session.token])

  const active = positions.filter((p) => computeStatus(p) === 'Open')
  const past = positions.filter((p) => computeStatus(p) !== 'Open')
  const activeStaked = active.reduce((sum, p) => sum + p.amount, 0)
  const pastStaked = past.reduce((sum, p) => sum + p.amount, 0)

  return (
    <section className="markets-layout" aria-labelledby="portfolio-title">
      <div className="section-heading portfolio-hero">
        <p className="eyebrow">Your positions</p>
        <h1 id="portfolio-title">Portfolio</h1>
        <p>Track all of your active UCLA market positions, review past results, and monitor the amounts you've staked.</p>
      </div>

      <div className="section-heading">
        <p className="eyebrow">Active Positions</p>
        <h1>Your market bets</h1>
        <p className="portfolio-meta">
          {active.length} {active.length === 1 ? 'position' : 'positions'}
          {' · '}
          ${activeStaked.toLocaleString()} staked
        </p>
      </div>
      <div className="portfolio-list">
        {active.map((p) => <PositionCard key={p.id_bet} position={p} />)}
        {active.length === 0 && <p className="empty-results">No active positions.</p>}
      </div>

      <div className="section-heading">
        <p className="eyebrow">Past Positions</p>
        <h1>Past bet results</h1>
        <p className="portfolio-meta">
          {past.length} {past.length === 1 ? 'position' : 'positions'}
          {' · '}
          ${pastStaked.toLocaleString()} staked
        </p>
      </div>
      <div className="portfolio-list">
        {past.map((p) => <PositionCard key={p.id_bet} position={p} />)}
        {past.length === 0 && <p className="empty-results">No past positions.</p>}
      </div>

      {error && <p className="form-error">{error}</p>}

      {!error && positions.length === 0 && (
        <p className="empty-results">You have not placed any bets yet.</p>
      )}
    </section>
  )
}

export default PortfolioPage
