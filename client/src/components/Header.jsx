import logo from '../assets/logo.PNG'

function Header({
  session,
  searchTerm,
  onSearchChange,
  onNavigateHome,
  onNavigateDashboard,
  onNavigateAdminCreate,
  onNavigateAdminManage,
  onNavigateLeaderboard,
  onNavigatePortfolio,
  onShowAuth,
  onLogout,
}) {
  const isAdmin = Boolean(session?.is_admin)

  return (
    <header className="site-header">
      <button
        className="brand"
        type="button"
        onClick={onNavigateHome}
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
          onChange={(event) => onSearchChange(event.target.value)}
          placeholder="Search markets..."
          type="search"
          value={searchTerm}
        />
      </form>

      <nav className="nav-actions" aria-label="Primary navigation">
        {session ? (
          <>
            <button type="button" onClick={onNavigateHome}>
              Markets
            </button>
            <button type="button" onClick={onNavigatePortfolio}>
              Portfolio
            </button>
            <button type="button" onClick={onNavigateLeaderboard}>
              Leaderboard
            </button>
            <button type="button" onClick={onNavigateDashboard}>
              Dashboard
            </button>
            {isAdmin && (
              <div className="admin-nav-menu">
                <button
                  aria-haspopup="true"
                  className="admin-menu-trigger"
                  type="button"
                >
                  Admin
                  <span aria-hidden="true">⌄</span>
                </button>
                <div className="admin-menu-panel">
                  <button type="button" onClick={onNavigateAdminManage}>
                  Manage markets
                  </button>
                  <button type="button" onClick={onNavigateAdminCreate}>
                  Create market
                  </button>
                </div>
              </div>
            )}
            <button className="logout-button" type="button" onClick={onLogout}>
              Logout
            </button>
          </>
        ) : (
          <>
            <button type="button" onClick={onNavigateHome}>
              Markets
            </button>
            <button type="button" onClick={onNavigateLeaderboard}>
              Leaderboard
            </button>
            <button type="button" onClick={() => onShowAuth('login')}>
              Login
            </button>
            <button
              className="primary-button"
              type="button"
              onClick={() => onShowAuth('register')}
            >
              Sign up
            </button>
          </>
        )}
      </nav>
    </header>
  )
}

export default Header
