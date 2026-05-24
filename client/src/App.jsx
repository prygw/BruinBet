import { useState } from 'react'
import './App.css'
import RegistrationPage from './Registration'
import { usePersistedSession } from './hooks/usePersistedSession'
import Header from './components/Header'
import PlaceBetModal from './components/PlaceBetModal'
import HomePage from './pages/HomePage'
import DashboardPage from './pages/DashboardPage'
import AdminCreateMarketPage from './pages/AdminCreateMarketPage'
import LeaderboardPage from './pages/LeaderboardPage'
import PortfolioPage from './pages/PortfolioPage'

function App() {
  const [session, setSession] = usePersistedSession()
  const [activeView, setActiveView] = useState(() =>
    session ? 'dashboard' : 'home',
  )
  const [authMode, setAuthMode] = useState('register')
  const [authPrompt, setAuthPrompt] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [marketBetPlacedOn, setMarketBetPlacedOn] = useState(null)

  function handleAuthenticate({ token, user, displayName }) {
    setSession({
      token,
      user,
      displayName: displayName || user.username,
      email: user.email,
      balance: user.balance,
      userId: user.id,
      is_admin: user.is_admin,
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

  function handlePlaceBet(market) {
    console.log('3. handlePlaceBet called, session is:', session, 'market is:', market)
    if (!session) {
      console.log('3a. no session, redirecting to auth')
      setAuthMode('register')
      setAuthPrompt('Create an account or log in to place a bet.')
      setActiveView('auth')
      return
    }
    console.log('3b. setting marketBetPlacedOn')
    setMarketBetPlacedOn(market)
    setTimeout(() => console.log('3c. after setState, marketBetPlacedOn was set with:', market), 0)
  }

  return (
    <div className="app-shell">
      <Header
        session={session}
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        onNavigateHome={() => setActiveView('home')}
        onNavigateDashboard={() => setActiveView('dashboard')}
        onNavigateAdminCreate={() => setActiveView('admin-create')}
        onNavigateLeaderboard={() => setActiveView('leaderboard')}
        onNavigatePortfolio={() => setActiveView('portfolio')}
        onShowAuth={showAuth}
        onLogout={handleLogout}
      />

      <main>
        {activeView === 'home' && (
          <HomePage
            onAction={handlePlaceBet}
            onShowAuth={showAuth}
            searchTerm={searchTerm}
            session={session}
          />
        )}

        {activeView === 'admin-create' && (
          <AdminCreateMarketPage
            session={session}
            onCreated={() => setActiveView('home')}
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
          <DashboardPage session={session} />
        )}

        {activeView === 'leaderboard' && <LeaderboardPage />}

        {activeView === 'portfolio' && session && (
          <PortfolioPage session={session} />
        )}
      </main>
      {console.log('4. render check, marketBetPlacedOn is:', marketBetPlacedOn)}
      {marketBetPlacedOn && (
        <PlaceBetModal
          market={marketBetPlacedOn}
          onClose={() => setMarketBetPlacedOn(null)}
        />
      )}
      {/* {marketBetPlacedOn && (
        <div style={{ position: 'fixed', top: 50, background: 'red', padding: '20px', zIndex: 999 }}>
          <h2>Modal is open! Market: {marketBetPlacedOn.market_name}</h2>
          <button onClick={() => setMarketBetPlacedOn(null)}>Close</button>
        </div>
      )} */}
    </div>
  )
}

export default App
