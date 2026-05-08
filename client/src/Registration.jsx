import { useState } from 'react'

const UCLA_EMAIL_PATTERN = /^[^@\s]+@(?:g\.)?ucla\.edu$/i

function RegistrationPage({ message, mode, onModeChange, onAuthenticate }) {
  const [loading, setLoading] = useState(false)
  const [displayName, setDisplayName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')

  const isRegistering = mode === 'register'

  async function handleSubmit(event) {
    // client-side validation
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
    setLoading(true)

    // all is good, attempt authentication
    try {
      const endpoint = isRegistering ? 'http://localhost:5001/api/auth/register' : 'http://localhost:5001/api/auth/login'
      const body = isRegistering 
        ? { email: email.trim(), password, username: displayName.trim() }
        : { email: email.trim(), password }

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || 'Authentication failed')
        setLoading(false)
        return
      }

      onAuthenticate({
        token: data.token,
        user: data.user,
        displayName: data.user.username || displayName.trim(),
      })
    } catch (err) {
      setError('Network error. Please try again.')
      setLoading(false)
    }
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
            disabled={loading}
          >
            Log in
          </button>
        </div>

        <button className="google-button" type="button" disabled={loading}>
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
              placeholder="John Smith"
              type="text"
              value={displayName}
              disabled={loading}
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
            disabled={loading}
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
            disabled={loading}
          />
        </label>

        <button className="primary-button large" type="submit" disabled={loading}>
          {loading ? 'Loading...' : isRegistering ? 'Create account' : 'Log in'}
        </button>

        <p className="auth-switch">
          {isRegistering ? 'Already have an account?' : 'Need an account?'}
          <button
            type="button"
            onClick={() => handleModeChange(isRegistering ? 'login' : 'register')}
            disabled={loading}
          >
            {isRegistering ? 'Log in here.' : 'Sign up here.'}
          </button>
        </p>
      </form>
    </section>
  )
}

export default RegistrationPage
