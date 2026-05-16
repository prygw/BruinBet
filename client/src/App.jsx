import { useEffect, useState } from 'react'
import './App.css'
import RegistrationPage from './Registration'
import BASE_URL from './api'
import { usePersistedSession } from './hooks/usePersistedSession'
import Header from './components/Header'

function formatTimeRemaining(closesAt) {
  const diff = new Date(closesAt) - Date.now()
  if (diff <= 0) return 'Closed'
  const days = Math.floor(diff / (1000 * 60 * 60 * 24))
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
  if (days > 0) return `${days}d ${hours}h`
  const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
  return `${hours}h ${mins}m`
}

function App() {
  const [session, setSession] = usePersistedSession()
  const [activeView, setActiveView] = useState(() =>
    session ? 'dashboard' : 'landing',
  )
  const [authMode, setAuthMode] = useState('register')
  const [authPrompt, setAuthPrompt] = useState('')
  const [searchTerm, setSearchTerm] = useState('')

  function handleAuthenticate({ token, user, displayName }) {
    setSession({
      token,
      user,
      displayName: displayName || user.username,
      email: user.email,
      balance: user.balance,
      userId: user.id,
    })
    setActiveView('dashboard')
    setAuthPrompt('')
  }

  function handleLogout() {
    setSession(null)
    setAuthMode('login')
    setActiveView('landing')
    setAuthPrompt('')
  }

  function showAuth(mode) {
    setAuthMode(mode)
    setActiveView('auth')
    setAuthPrompt('')
  }

  function handlePlaceBet() {
    if (session) {
      setActiveView('dashboard')
      return
    }

    setAuthMode('register')
    setAuthPrompt('Create an account or log in to place a bet.')
    setActiveView('auth')
  }

  return (
    <div className="app-shell">
      <Header
        session={session}
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        onNavigateLanding={() => setActiveView('landing')}
        onNavigateDashboard={() => setActiveView('dashboard')}
        onShowAuth={showAuth}
        onLogout={handleLogout}
      />
      <main>
        {activeView === 'landing' && (
          <Landing
            onPlaceBet={handlePlaceBet}
            onShowAuth={showAuth}
            searchTerm={searchTerm}
            session={session}
          />
        )}

        {activeView === 'auth' && (
          <RegistrationPage
            message={authPrompt}
            mode={authMode}
            onModeChange={setAuthMode}
            onAuthenticate={handleAuthenticate}
          />
        )}

        {activeView === 'dashboard' && session && (
          <Dashboard session={session} />
        )}
      </main>
    </div>
  )
}

function Landing({ onPlaceBet, onShowAuth, searchTerm, session }) {
  return (
    <section className="landing-layout" aria-labelledby="landing-title">
      <div className="landing-hero">
        <p className="eyebrow">Open markets</p>
        <h1 id="landing-title">Browse campus predictions before you bet</h1>
        <p>
          Track active UCLA markets, compare prices, and sign in only when you
          are ready to place a position.
        </p>
        {!session && (
          <div className="hero-actions">
            <button
              className="primary-button"
              type="button"
              onClick={() => onShowAuth('register')}
            >
              Sign up to bet
            </button>
            <button
              className="secondary-button"
              type="button"
              onClick={() => onShowAuth('login')}
            >
              Login
            </button>
          </div>
        )}
      </div>

      <MarketPreviewGrid
        actionLabel={session ? 'Place bet' : 'Sign up to bet'}
        onPlaceBet={onPlaceBet}
        searchTerm={searchTerm}
        previewLimit={session ? null : 3}
      />
    </section>
  )
}

function Dashboard({ session }) {
  return (
    <section className="dashboard-layout" aria-labelledby="dashboard-title">
      <div className="dashboard-panel">
        <p className="eyebrow">Signed in</p>
        <h1 id="dashboard-title">Welcome, {session.displayName}</h1>
        <p>Your UCLA account is active.</p>
      </div>

      <div className="account-summary" aria-label="Account summary">
        <SummaryItem label="Email" value={session.email} />
        <SummaryItem
          label="Balance"
          value={`$${session.balance.toLocaleString()}`}
        />
        <SummaryItem label="Access" value="Betting enabled" />
      </div>
    </section>
  )
}

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

function SummaryItem({ label, value }) {
  return (
    <article className="summary-item">
      <span>{label}</span>
      <strong>{value}</strong>
    </article>
  )
}

export default App
