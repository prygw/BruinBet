import { useState, useEffect } from 'react'
import './App.css'
import BASE_URL from './api'
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
  const [marketBetDist, setMarketBetDist] = useState({})

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
    if (!session) {
      setAuthMode('register')
      setAuthPrompt('Create an account or log in to place a bet.')
      setActiveView('auth')
      return
    }
    setMarketBetPlacedOn(market)
  }

  function handleBetSuccess(marketId, market, chosenOptionId) {
    setMarketBetDist((current) => ({
      ...current,
      [marketId]: { options: market.options, chosenOptionId },
    }))
  }

  useEffect(() => {
    if (!session?.token) {
      setMarketBetDist({})
      return
    }

    async function fetchVotedMarkets() {
      try {
        const res = await fetch(`${BASE_URL}/api/portfolio`, {
          headers: {
            Authorization: `Bearer ${session.token}`,
          },
        })

        if (!res.ok) {
          throw new Error('Unable to load votes')
        }

        const data = await res.json()
        const votes = {}

        data.positions.forEach((position) => {
          if (!votes[position.id_market]) {
            votes[position.id_market] = {
              chosenOptionId: position.id_option,
            }
          }
        })

        setMarketBetDist(votes)
      } catch (err) {
        setMarketBetDist({})
      }
    }

    fetchVotedMarkets()
  }, [session?.token])

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
            marketBetDist={marketBetDist}
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
      {marketBetPlacedOn && (
        <PlaceBetModal
          market={marketBetPlacedOn}
          balance={session?.balance ?? 0}
          onClose={() => setMarketBetPlacedOn(null)}
          onBetSuccess={handleBetSuccess}
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
