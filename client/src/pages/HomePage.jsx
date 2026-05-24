import MarketPreviewGrid from '../components/MarketPreviewGrid'

function HomePage({ onAction, onShowAuth, searchTerm, session }) {
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
      onButtonClick={(market) => {
        console.log('2. HomePage onButtonClick fired, onAction is:', onAction)
        onAction(market)
      }}
      searchTerm={searchTerm}
      previewLimit={session ? null : 3}
    />
    </section>
  )
}

export default HomePage
