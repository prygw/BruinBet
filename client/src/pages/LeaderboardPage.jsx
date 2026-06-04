import { useEffect, useState } from 'react'
import BASE_URL from '../api'

const SORT_COLUMNS = [
  { key: 'rank', label: 'Rank' },
  { key: 'username', label: 'User' },
  { key: 'balance', label: 'Balance' },
  { key: 'total_bet_amount', label: 'Total bet' },
  { key: 'bet_count', label: 'Bets placed' },
]

function LeaderboardPage() {
  const [users, setUsers] = useState([])
  const [error, setError] = useState('')
  const [sort, setSort] = useState({ key: 'rank', direction: 'asc' })

  useEffect(() => {
    fetch(`${BASE_URL}/api/leaderboard`)
      .then((res) => {
        if (!res.ok) throw new Error('Failed to load leaderboard')
        return res.json()
      })
      .then((data) => setUsers(data.users || []))
      .catch(() => setError('Could not load the leaderboard. Please try again.'))
  }, [])

  function handleSort(key) {
    setSort((current) => ({
      key,
      direction: current.key === key && current.direction === 'asc' ? 'desc' : 'asc',
    }))
  }

  const rankedUsers = users.map((user, index) => ({
    ...user,
    rank: index + 1,
  }))

  const sortedUsers = [...rankedUsers].sort((a, b) => {
    const direction = sort.direction === 'asc' ? 1 : -1

    if (sort.key === 'username') {
      return a.username.localeCompare(b.username) * direction
    }

    return (Number(a[sort.key] || 0) - Number(b[sort.key] || 0)) * direction
  })

  return (
    <section className="markets-layout" aria-labelledby="leaderboard-title">
      <div className="section-heading">
        <p className="eyebrow">All bettors</p>
        <h1 id="leaderboard-title">Campus leaderboard</h1>
      </div>

      {error && <p className="form-error">{error}</p>}

      <table className="leaderboard-table">
        <thead>
          <tr>
            {SORT_COLUMNS.map((column) => (
              <th key={column.key}>
                <button
                  type="button"
                  className="leaderboard-sort-button"
                  onClick={() => handleSort(column.key)}
                >
                  {column.label}
                  <span>{sort.key === column.key ? (sort.direction === 'asc' ? '↑' : '↓') : '↕'}</span>
                </button>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {sortedUsers.map((user) => (
            <tr key={user.id}>
              <td>{user.rank}</td>
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
