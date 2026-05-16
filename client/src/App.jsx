import { useEffect, useState } from 'react'
import './App.css'
import RegistrationPage from './Registration'
import { usePersistedSession } from './hooks/usePersistedSession'
import Header from './components/Header'
import MarketPreviewGrid from './components/MarketPreviewGrid'

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

function SummaryItem({ label, value }) {
  return (
    <article className="summary-item">
      <span>{label}</span>
      <strong>{value}</strong>
    </article>
  )
}

export default App
