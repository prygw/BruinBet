import { useEffect, useState } from 'react'
import './App.css'
import RegistrationPage from './Registration'
import logo from './assets/logo.PNG'

const SESSION_KEY = 'bruinbet-session'

const marketPreviews = [
  {
    title: 'UCLA wins the next rivalry game',
    price: '62%',
    liquidity: '$8.4k',
    closes: '4d 6h',
  },
  {
    title: 'Ackerman lines stay under 20 minutes Friday',
    price: '44%',
    liquidity: '$2.1k',
    closes: '1d 3h',
  },
  {
    title: 'Bruins finish top 3 in the conference',
    price: '71%',
    liquidity: '$12.7k',
    closes: '9d 1h',
  },
]

function getStoredSession() {
  try {
    const storedSession = localStorage.getItem(SESSION_KEY)
    return storedSession ? JSON.parse(storedSession) : null
  } catch {
    localStorage.removeItem(SESSION_KEY)
    return null
  }
}

function App() {
  const [session, setSession] = useState(() => getStoredSession())
  const [activeView, setActiveView] = useState(() =>
    getStoredSession() ? 'dashboard' : 'landing',
  )
  const [authMode, setAuthMode] = useState('register')
  const [authPrompt, setAuthPrompt] = useState('')
  const [searchTerm, setSearchTerm] = useState('')

  useEffect(() => {
    if (session) {
      localStorage.setItem(SESSION_KEY, JSON.stringify(session))
      return
    }

    localStorage.removeItem(SESSION_KEY)
  }, [session])

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
      <header className="site-header">
        <button
          className="brand"
          type="button"
          onClick={() => setActiveView('landing')}
        >
          <img className="brand-logo" src={logo} alt="BruinBet" />
          <span>
            <strong>BruinBet</strong>
            <small>UCLA prediction markets</small>
          </span>
        </button>

        <form
          className="market-search"
          onSubmit={(event) => event.preventDefault()}
          role="search"
        >
          <svg
            aria-hidden="true"
            className="search-icon"
            focusable="false"
            viewBox="0 0 24 24"
          >
            <path d="m21 21-4.3-4.3m1.3-5.2a6.5 6.5 0 1 1-13 0 6.5 6.5 0 0 1 13 0Z" />
          </svg>
          <input
            aria-label="Search markets"
            onChange={(event) => setSearchTerm(event.target.value)}
            placeholder="Search markets..."
            type="search"
            value={searchTerm}
          />
        </form>

        <nav className="nav-actions" aria-label="Primary navigation">
          {session ? (
            <>
              <button type="button" onClick={() => setActiveView('landing')}>
                Markets
              </button>
              <button type="button" onClick={() => setActiveView('dashboard')}>
                Dashboard
              </button>
              <button className="logout-button" type="button" onClick={handleLogout}>
                Logout
              </button>
            </>
          ) : (
            <>
              <button type="button" onClick={() => setActiveView('landing')}>
                Markets
              </button>
              <button type="button" onClick={() => showAuth('login')}>
                Login
              </button>
              <button
                className="primary-button"
                type="button"
                onClick={() => showAuth('register')}
              >
                Sign up
              </button>
            </>
          )}
        </nav>
      </header>

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
          <Dashboard
            session={session}
            onViewMarkets={() => setActiveView('landing')}
          />
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
      />
    </section>
  )
}

function Dashboard({ session, onViewMarkets }) {
  return (
    <section className="dashboard-layout" aria-labelledby="dashboard-title">
      <div className="dashboard-panel">
        <p className="eyebrow">Signed in</p>
        <h1 id="dashboard-title">Welcome, {session.displayName}</h1>
        <p>
          Your UCLA account is active. Track your balance and return to the
          public markets whenever you want to browse.
        </p>
        <button className="primary-button large" type="button" onClick={onViewMarkets}>
          View markets
        </button>
      </div>

      <div className="account-summary" aria-label="Account summary">
        <SummaryItem label="Email" value={session.email} />
        <SummaryItem
          label="Starting balance"
          value={`$${session.balance.toLocaleString()}`}
        />
        <SummaryItem label="Access" value="Betting enabled" />
      </div>
    </section>
  )
}

function MarketPreviewGrid({ actionLabel, onPlaceBet, searchTerm }) {
  const normalizedSearch = searchTerm.trim().toLowerCase()
  const filteredMarkets = normalizedSearch
    ? marketPreviews.filter((market) =>
        market.title.toLowerCase().includes(normalizedSearch),
      )
    : marketPreviews

  return (
    <section className="markets-layout" aria-labelledby="markets-title">
      <div className="section-heading">
        <p className="eyebrow">Active markets</p>
        <h1 id="markets-title">Campus market preview</h1>
      </div>

      <div className="market-grid">
        {filteredMarkets.map((market) => (
          <article className="market-card" key={market.title}>
            <h2>{market.title}</h2>
            <dl>
              <div>
                <dt>Yes price</dt>
                <dd>{market.price}</dd>
              </div>
              <div>
                <dt>Liquidity</dt>
                <dd>{market.liquidity}</dd>
              </div>
              <div>
                <dt>Closes</dt>
                <dd>{market.closes}</dd>
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

      {filteredMarkets.length === 0 && (
        <p className="empty-results">No markets match your search.</p>
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
