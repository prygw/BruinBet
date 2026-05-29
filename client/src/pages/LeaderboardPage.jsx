import { useEffect, useState } from 'react'
import BASE_URL from '../api'

function LeaderboardPage() {
  const [users, setUsers] = useState([])
  const [error, setError] = useState('')

  useEffect(() => {
    fetch(`${BASE_URL}/api/leaderboard`)
      .then((res) => {
        if (!res.ok) throw new Error('Failed to load leaderboard')
        return res.json()
      })
      .then((data) => setUsers(data.users || []))
      .catch(() => setError('Could not load the leaderboard. Please try again.'))
  }, [])

  return (
    <section className="markets-layout" aria-labelledby="leaderboard-title">
      <div className="section-heading">
        <p className="eyebrow">Top bettors</p>
        <h1 id="leaderboard-title">Campus leaderboard</h1>
      </div>

      {error && <p className="form-error">{error}</p>}

      <table className="leaderboard-table">
        <thead>
          <tr>
            <th>Rank</th>
            <th>User</th>
            <th>Balance</th>
            <th>Total bet</th>
            <th>Bets placed</th>
          </tr>
        </thead>
        <tbody>
          {users.map((user, index) => (
            <tr key={user.id}>
              <td>{index + 1}</td>
              <td>{user.username}</td>
              <td>${user.balance.toLocaleString()}</td>
              <td>${user.total_bet_amount.toLocaleString()}</td>
              <td>{user.bet_count}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  )
}

export default LeaderboardPage
