import { useEffect, useState } from 'react'
import './App.css'
import RegistrationPage from './Registration'
import { usePersistedSession } from './hooks/usePersistedSession'
import Header from './components/Header'
import HomePage from './pages/HomePage'

function App() {
  const [session, setSession] = usePersistedSession()
  const [activeView, setActiveView] = useState(() =>
    session ? 'dashboard' : 'home',
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
    setActiveView('home')
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
        onNavigateHome={() => setActiveView('home')}
        onNavigateDashboard={() => setActiveView('dashboard')}
        onShowAuth={showAuth}
        onLogout={handleLogout}
      />
      <main>
        {activeView === 'home' && (
          <HomePage
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
