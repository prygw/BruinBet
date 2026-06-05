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
import AdminManageMarketsPage from './pages/AdminManageMarketsPage'
import LeaderboardPage from './pages/LeaderboardPage'
import PortfolioPage from './pages/PortfolioPage'

function buildMarketBetDist(positions = []) {
  const votes = {}

  positions.forEach((position) => {
    const currentVote = votes[position.id_market]

    votes[position.id_market] = {
      chosenOptionId: currentVote?.chosenOptionId ?? position.id_option,
      positionCount: Number(currentVote?.positionCount || 0) + 1,
    }
  })

  return votes
}

function App() {
  const [session, setSession] = usePersistedSession()
  const [activeView, setActiveView] = useState(() =>
    session ? 'dashboard' : 'home',
  )
  const [authMode, setAuthMode] = useState('register')
  const [authPrompt, setAuthPrompt] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [marketBetPlacedOn, setMarketBetPlacedOn] = useState(null)
  const [initialBetOptionId, setInitialBetOptionId] = useState(null)
  const [marketBetDist, setMarketBetDist] = useState({})
  // AI-GENERATED CODE START: track personalized recommended market IDs
  const [recommendedMarketIds, setRecommendedMarketIds] = useState([])
  // AI-GENERATED CODE END: track personalized recommended market IDs

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
    setMarketBetDist({})
    // AI-GENERATED CODE START: clear recommendations on logout
    setRecommendedMarketIds([])
    // AI-GENERATED CODE END: clear recommendations on logout
    setAuthMode('login')
    setActiveView('home')
    setAuthPrompt('')
  }

  function showAuth(mode) {
    setAuthMode(mode)
    setActiveView('auth')
    setAuthPrompt('')
  }

  function handlePlaceBet(market, selectedOptionId = null) {
    if (!session) {
      setAuthMode('register')
      setAuthPrompt('Create an account or log in to place a bet.')
      setActiveView('auth')
      return
    }
    setInitialBetOptionId(selectedOptionId)
    setMarketBetPlacedOn(market)
  }

  async function refreshMarketBetDistAfterBet(token) {
    if (!token) {
      return
    }

    try {
      const res = await fetch(`${BASE_URL}/api/portfolio`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (!res.ok) {
        throw new Error('Unable to load votes')
      }

      const data = await res.json()
      setMarketBetDist(buildMarketBetDist(data.positions || []))
    } catch {
      // Keep the last known local position state if a refresh fails.
    }
  }

  function handleBetSuccess(marketId, market, chosenOptionId, nextBalance = null, nextPositionCount = null) {
    setMarketBetDist((current) => {
      const previousPositionCount = Number(current[marketId]?.positionCount || 0)
      const positionCount = Number.isInteger(nextPositionCount)
        ? nextPositionCount
        : previousPositionCount + 1

      return {
        ...current,
        [marketId]: {
          options: market.options,
          chosenOptionId,
          positionCount,
        },
      }
    })

    refreshMarketBetDistAfterBet(session?.token)

    if (nextBalance !== null) {
      setSession((current) => {
        if (!current) {
          return current
        }

        return {
          ...current,
          balance: nextBalance,
          user: current.user
            ? { ...current.user, balance: nextBalance }
            : current.user,
        }
      })
    }
  }

  useEffect(() => {
    if (activeView !== 'dashboard' || !session?.token) return

    async function refreshBalance() {
      try {
        const res = await fetch(`${BASE_URL}/api/auth/me`, {
          headers: { Authorization: `Bearer ${session.token}` },
        })
        if (!res.ok) return
        const data = await res.json()
        setSession((current) =>
          current ? { ...current, balance: data.user.balance } : current,
        )
      } catch {
        // ignore refresh errors
      }
    }

    refreshBalance()
  }, [activeView])

  useEffect(() => {
    if (!session?.token) {
      return
    }

    let ignore = false

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
        if (!ignore) {
          setMarketBetDist(buildMarketBetDist(data.positions || []))
        }
      } catch {
        if (!ignore) {
          setMarketBetDist({})
        }
      }
    }

    fetchVotedMarkets()

    return () => {
      ignore = true
    }
  }, [session?.token])

  // AI-GENERATED CODE START: fetch personalized recommended market IDs for signed-in users
  useEffect(() => {
    if (!session?.token) {
      setRecommendedMarketIds([])
      return
    }

    let ignore = false

    async function fetchRecommendations() {
      try {
        const res = await fetch(`${BASE_URL}/api/recommendations`, {
          headers: {
            Authorization: `Bearer ${session.token}`,
          },
        })

        if (!res.ok) {
          throw new Error('Unable to load recommendations')
        }

        const data = await res.json()
        if (!ignore) {
          setRecommendedMarketIds(data.recommended_market_ids || [])
        }
      } catch {
        if (!ignore) {
          setRecommendedMarketIds([])
        }
      }
    }

    fetchRecommendations()

    return () => {
      ignore = true
    }
  }, [session?.token, marketBetDist])
  // AI-GENERATED CODE END: fetch personalized recommended market IDs for signed-in users

  return (
    <div className="app-shell">
      <Header
        session={session}
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        onNavigateHome={() => setActiveView('home')}
        onNavigateDashboard={() => setActiveView('dashboard')}
        onNavigateAdminCreate={() => setActiveView('admin-create')}
        onNavigateAdminManage={() => setActiveView('admin-manage')}
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
            {...{
              // AI-GENERATED CODE START: pass personalized recommendation IDs into HomePage
              recommendedMarketIds,
              // AI-GENERATED CODE END: pass personalized recommendation IDs into HomePage
            }}
          />
        )}

        {activeView === 'admin-create' && (
          <AdminCreateMarketPage
            session={session}
            onCreated={() => setActiveView('home')}
          />
        )}

        {activeView === 'admin-manage' && (
          <AdminManageMarketsPage session={session} />
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
          <DashboardPage session={session} onAccountDeleted={handleLogout} />
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
          initialSelectedOptionId={initialBetOptionId}
          onClose={() => {
            setMarketBetPlacedOn(null)
            setInitialBetOptionId(null)
          }}
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
