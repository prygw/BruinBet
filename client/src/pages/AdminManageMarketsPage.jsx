import { useEffect, useState } from 'react'
import BASE_URL from '../api'
// import StatusBar from '../components/StatusBar'

const MARKET_STATUSES = ['open', 'expired', 'closed']

function toDateTimeLocal(value) {
  if (!value) return ''
  const date = new Date(value)
  const offsetMs = date.getTimezoneOffset() * 60 * 1000
  return new Date(date.getTime() - offsetMs).toISOString().slice(0, 16)
}

function getMarketState(market) {
  if (market.status === 'closed' || market.winning_option_id) return 'Resolved'
  if (market.status === 'expired') return 'Awaiting result'
  return 'Open'
}

function getMarketOptions(market) {
  return Array.isArray(market.options) ? market.options : []
}

async function fetchAdminMarkets(session) {
  const groups = await Promise.all(
    MARKET_STATUSES.map(async (status) => {
      const res = await fetch(`${BASE_URL}/api/markets?status=${status}`)
      if (!res.ok) throw new Error('Unable to load markets')
      const data = await res.json()
      return data.markets || []
    }),
  )

  return groups
    .flat()
    .filter((market) => market.created_by === session.userId)
    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
}

function AdminManageMarketsPage({ session }) {
  const [markets, setMarkets] = useState([])
  const [drafts, setDrafts] = useState({})
  const [winningOptions, setWinningOptions] = useState({})
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [savingId, setSavingId] = useState(null)

  useEffect(() => {
    if (!session?.is_admin) return

    let cancelled = false

    async function loadMarkets() {
      try {
        setLoading(true)
        const nextMarkets = await fetchAdminMarkets(session)
        if (!cancelled) {
          setMarkets(nextMarkets)
          setError('')
        }
      } catch (err) {
        if (!cancelled) {
          setError(err.message || 'Unable to load markets')
        }
      } finally {
        if (!cancelled) {
          setLoading(false)
        }
      }
    }

    loadMarkets()

    return () => {
      cancelled = true
    }
  }, [session])

  if (!session?.is_admin) {
    return <p className="empty-results text-center mt-10">Admins only.</p>
  }

  function getDraft(market) {
    return drafts[market.id] || {
      market_name: market.market_name,
      description: market.description,
      category: market.category || '',
      closes_at: toDateTimeLocal(market.closes_at),
      options: getMarketOptions(market).map((option) => option.label),
    }
  }

  function updateDraft(market, patch) {
    setDrafts((current) => ({
      ...current,
      [market.id]: {
        ...getDraft(market),
        ...patch,
      },
    }))
  }

  function updateOption(market, index, value) {
    const draft = getDraft(market)
    updateDraft(market, {
      options: draft.options.map((option, optionIndex) => optionIndex === index ? value : option),
    })
  }

  function addOption(market) {
    const draft = getDraft(market)
    updateDraft(market, { options: [...draft.options, ''] })
  }

  function removeOption(market, index) {
    const draft = getDraft(market)
    updateDraft(market, {
      options: draft.options.filter((_, optionIndex) => optionIndex !== index),
    })
  }

  async function saveMarket(market) {
    const draft = getDraft(market)
    setSavingId(market.id)
    setMessage('')
    setError('')

    try {
      const res = await fetch(`${BASE_URL}/api/markets/${market.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.token}`,
        },
        body: JSON.stringify({
          ...draft,
          closes_at: draft.closes_at ? new Date(draft.closes_at).toISOString() : null,
        }),
      })

      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.error || 'Unable to save market')
      }

      setMarkets((current) =>
        current.map((item) => item.id === market.id ? data.market : item),
      )
      setDrafts((current) => {
        const nextDrafts = { ...current }
        delete nextDrafts[market.id]
        return nextDrafts
      })
      setMessage('Market updated.')
    } catch (err) {
      setError(err.message || 'Unable to save market')
    } finally {
      setSavingId(null)
    }
  }

  async function resolveMarket(market) {
    const winningOptionId = Number(winningOptions[market.id])
    if (!Number.isInteger(winningOptionId)) {
      setError('Choose a winning option before resolving.')
      return
    }

    setSavingId(market.id)
    setMessage('')
    setError('')

    try {
      const res = await fetch(`${BASE_URL}/api/markets/${market.id}/resolve`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.token}`,
        },
        body: JSON.stringify({ winning_option_id: winningOptionId }),
      })

      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.error || 'Unable to resolve market')
      }

      if (!data.market || !data.resolution) {
        throw new Error('Resolve response was missing market data')
      }

      setMarkets((current) =>
        current.map((item) => item.id === market.id ? data.market : item),
      )
      setMessage(`Market resolved. ${Number(data.resolution.winner_count || 0).toLocaleString()} winner(s) paid from a $${Number(data.resolution.total_pool || 0).toLocaleString()} pool.`)
    } catch (err) {
      setError(err.message || 'Unable to resolve market')
    } finally {
      setSavingId(null)
    }
  }

  async function removeMarket(market) {
    const confirmed = window.confirm('Remove this listing and refund all bets? This cannot be undone.')
    if (!confirmed) {
      return
    }

    setSavingId(market.id)
    setMessage('')
    setError('')

    try {
      const res = await fetch(`${BASE_URL}/api/markets/${market.id}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${session.token}`,
        },
      })

      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.error || 'Unable to remove market')
      }

      setMarkets((current) => current.filter((item) => item.id !== market.id))
      setDrafts((current) => {
        const nextDrafts = { ...current }
        delete nextDrafts[market.id]
        return nextDrafts
      })
      setWinningOptions((current) => {
        const nextWinningOptions = { ...current }
        delete nextWinningOptions[market.id]
        return nextWinningOptions
      })
      setMessage(`Listing removed. Refunded $${Number(data.refund_total || 0).toLocaleString()} to ${data.refunds.length} user(s).`)
    } catch (err) {
      setError(err.message || 'Unable to remove market')
    } finally {
      setSavingId(null)
    }
  }

  return (
    <section className="markets-layout" aria-labelledby="admin-manage-title">
      <div className="section-heading">
        <p className="eyebrow">Admin tools</p>
        <h1 id="admin-manage-title">Manage your markets</h1>
      </div>

      {message && <p className="form-message">{message}</p>}
      {error && <p className="form-error">{error}</p>}
      {loading && <p className="empty-results">Loading markets...</p>}

      <div className="market-grid">
        {markets.map((market) => {
          const draft = getDraft(market)
          const marketOptions = getMarketOptions(market)
          const locked = market.status === 'closed' || Boolean(market.winning_option_id)
          const hasBets = Number(market.bet_count || 0) > 0

          return (
            <article className="market-card" key={market.id}>
              <p className="eyebrow">{getMarketState(market)}</p>

              <label>
                Market question
                <input
                  type="text"
                  value={draft.market_name}
                  disabled={locked}
                  onChange={(event) => updateDraft(market, { market_name: event.target.value })}
                />
              </label>

              <label>
                Rules & description
                <textarea
                  rows={4}
                  value={draft.description}
                  disabled={locked}
                  onChange={(event) => updateDraft(market, { description: event.target.value })}
                />
              </label>

              <label>
                Category
                <input
                  type="text"
                  value={draft.category}
                  disabled={locked}
                  onChange={(event) => updateDraft(market, { category: event.target.value })}
                />
              </label>

              <label>
                Closes at
                <input
                  type="datetime-local"
                  value={draft.closes_at}
                  disabled={locked}
                  onChange={(event) => updateDraft(market, { closes_at: event.target.value })}
                />
              </label>

              <div className="bet-field">
                <label>Outcomes</label>
                {draft.options.map((option, index) => (
                  <div key={`${market.id}-${index}`} style={{ display: 'flex', gap: 10 }}>
                    <input
                      type="text"
                      value={option}
                      disabled={locked}
                      onChange={(event) => updateOption(market, index, event.target.value)}
                    />
                    <button
                      type="button"
                      disabled={locked || hasBets || draft.options.length <= 2}
                      onClick={() => removeOption(market, index)}
                    >
                      Remove
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  disabled={locked || hasBets}
                  onClick={() => addOption(market)}
                >
                  Add outcome
                </button>
                {hasBets && !locked && (
                  <p className="form-message">Bets exist, so outcomes can be renamed but not added or removed.</p>
                )}
              </div>

              {/* <StatusBar options={marketOptions} title="Current distribution" /> */}

              {!locked && (
                <button
                  className="market-action"
                  type="button"
                  disabled={savingId === market.id}
                  onClick={() => saveMarket(market)}
                >
                  {savingId === market.id ? 'Saving...' : 'Save changes'}
                </button>
              )}

              {!locked && (
                <div className="bet-field">
                  <label>Assign result</label>
                  <select
                    value={winningOptions[market.id] || ''}
                    onChange={(event) =>
                      setWinningOptions((current) => ({
                        ...current,
                        [market.id]: event.target.value,
                      }))
                    }
                  >
                    <option value="">Choose winner</option>
                    {marketOptions.map((option) => (
                      <option key={option.id} value={option.id}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                  <button
                    className="logout-button"
                    type="button"
                    disabled={savingId === market.id}
                    onClick={() => resolveMarket(market)}
                  >
                    Resolve now
                  </button>
                </div>
              )}

              <button
                className="logout-button"
                type="button"
                disabled={locked || savingId === market.id}
                onClick={() => removeMarket(market)}
              >
                Remove listing
              </button>
            </article>
          )
        })}
      </div>

      {!loading && markets.length === 0 && (
        <p className="empty-results">You have not created any markets yet.</p>
      )}
    </section>
  )
}

export default AdminManageMarketsPage
