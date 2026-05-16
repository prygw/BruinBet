function DashboardPage({ session }) {
  return (
    <section className="dashboard-layout" aria-labelledby="dashboard-title">
      <div className="dashboard-panel">
        <p className="eyebrow">Signed in</p>
        <h1 id="dashboard-title">Welcome, {session.displayName}</h1>
        <p>Your UCLA account is active.</p>
      </div>

      <div className="account-summary" aria-label="Account summary">
        <SummaryItem label="Email" value={session.email} />
        <SummaryItem
          label="Balance"
          value={`$${session.balance.toLocaleString()}`}
        />
        <SummaryItem label="Access" value="Betting enabled" />
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
