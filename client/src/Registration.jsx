import { useState } from 'react'

const UCLA_EMAIL_PATTERN = /^[^@\s]+@(?:g\.)?ucla\.edu$/i

function RegistrationPage({ message, mode, onModeChange, onAuthenticate }) {
  const [displayName, setDisplayName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')

  const isRegistering = mode === 'register'

  function handleSubmit(event) {
    event.preventDefault()

    if (!UCLA_EMAIL_PATTERN.test(email.trim())) {
      setError('Use a UCLA email ending in @ucla.edu or @g.ucla.edu.')
      return
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters.')
      return
    }

    setError('')
    onAuthenticate({
      displayName: displayName.trim(),
      email: email.trim(),
    })
  }

  function handleModeChange(nextMode) {
    setError('')
    onModeChange(nextMode)
  }

  return (
    <section className="auth-layout" aria-labelledby="auth-title">
      <div className="auth-intro">
        <p className="eyebrow">UCLA access</p>
        <h1 id="auth-title">
          {isRegistering ? 'Sign up for BruinBet' : 'Log in to BruinBet'}
        </h1>
        <p>
          Use your campus email when you are ready to place bets, track your
          balance, and manage your positions.
        </p>

        <div className="auth-highlights" aria-label="Account features">
          <span>UCLA email</span>
          <span>Practice balance</span>
          <span>Bet placement</span>
        </div>
      </div>

      <form className="auth-card" onSubmit={handleSubmit}>
        {message && <p className="form-message">{message}</p>}

        <div className="mode-tabs" role="tablist" aria-label="Auth mode">
          <button
            aria-selected={isRegistering}
            role="tab"
            type="button"
            onClick={() => handleModeChange('register')}
          >
            Sign up
          </button>
          <button
            aria-selected={!isRegistering}
            role="tab"
            type="button"
            onClick={() => handleModeChange('login')}
          >
            Log in
          </button>
        </div>

        <button className="google-button" type="button">
          Continue with Google
        </button>

        <div className="divider">
          <span>or</span>
        </div>

        {error && <p className="form-error">{error}</p>}

        {isRegistering && (
          <label>
            Display name
            <input
              autoComplete="name"
              name="displayName"
              onChange={(event) => setDisplayName(event.target.value)}
              placeholder="Harry Yu"
              type="text"
              value={displayName}
            />
          </label>
        )}

        <label>
          Email address
          <input
            autoComplete="email"
            name="email"
            onChange={(event) => setEmail(event.target.value)}
            placeholder="name@g.ucla.edu"
            required
            type="email"
            value={email}
          />
        </label>

        <label>
          Password
          <input
            autoComplete={isRegistering ? 'new-password' : 'current-password'}
            minLength="8"
            name="password"
            onChange={(event) => setPassword(event.target.value)}
            placeholder="Minimum 8 characters"
            required
            type="password"
            value={password}
          />
        </label>

        <button className="primary-button large" type="submit">
          {isRegistering ? 'Create account' : 'Log in'}
        </button>

        <p className="auth-switch">
          {isRegistering ? 'Already have an account?' : 'Need an account?'}
          <button
            type="button"
            onClick={() => handleModeChange(isRegistering ? 'login' : 'register')}
          >
            {isRegistering ? 'Log in here.' : 'Sign up here.'}
          </button>
        </p>
      </form>
    </section>
  )
}

export default RegistrationPage
