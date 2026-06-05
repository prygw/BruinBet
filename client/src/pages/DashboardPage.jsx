import { useState } from 'react'
import BASE_URL from '../api'

function DashboardPage({ onAccountDeleted, session }) {
  const [deleting, setDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState('')
  const accessLabel = session.is_admin ? 'Admin controls enabled' : 'Betting enabled'

  async function handleDeleteAccount() {
    const confirmed = window.confirm('Are you sure? This action cannot be undone.')
    if (!confirmed) {
      return
    }

    setDeleting(true)
    setDeleteError('')

    try {
      const res = await fetch(`${BASE_URL}/api/auth/me`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${session.token}`,
        },
      })

      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.error || 'Unable to delete account')
      }

      onAccountDeleted()
    } catch (err) {
      setDeleteError(err.message || 'Unable to delete account')
      setDeleting(false)
    }
  }

  return (
    <section className="dashboard-layout" aria-labelledby="dashboard-title">
      <div className="dashboard-panel">
        <p className="eyebrow">Signed in</p>
        <h1 id="dashboard-title">
          Welcome, <br />
          <span>{session.displayName}</span>
        </h1>
        <p>Your UCLA account is active.</p>
        {!session.is_admin && (
          <button
            className="danger-button"
            type="button"
            onClick={handleDeleteAccount}
            disabled={deleting}
          >
            {deleting ? 'Deleting...' : 'Delete account'}
          </button>
        )}
        {deleteError && <p className="form-error">{deleteError}</p>}
      </div>

      <div className="account-summary" aria-label="Account summary">
        <SummaryItem label="Email" value={session.email} />
        {!session.is_admin && (
          <SummaryItem
            label="Balance"
            value={`$${session.balance.toLocaleString()}`}
          />
        )}
        <SummaryItem label="Access" value={accessLabel} />
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

export default DashboardPage
