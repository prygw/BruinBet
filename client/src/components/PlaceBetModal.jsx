import { useEffect, useState } from 'react'
import BASE_URL from '../api'
import { usePlaceBet, BET_STATUS } from '../hooks/usePlaceBet'
import { useProbabilityHistory } from '../hooks/useProbabilityHistory'
import ProbabilityChart from './ProbabilityChart'

const LIVE_MARKET_REFRESH_MS = 3000
const QUICK_AMOUNTS = [5, 10, 25, 100]
const TIME_WINDOWS = [
  { key: 'month', label: 'Past month', windowMs: 30 * 24 * 60 * 60 * 1000 },
  { key: 'week', label: 'Past week', windowMs: 7 * 24 * 60 * 60 * 1000 },
  { key: 'day', label: 'Past 24hr', windowMs: 24 * 60 * 60 * 1000 },
  { key: 'hour', label: 'Past hour', windowMs: 60 * 60 * 1000 },
  { key: 'all', label: 'All', windowMs: null },
]

function PlaceBetModal({ market, balance, initialSelectedOptionId = null, onClose, onBetSuccess }) {
  const marketId = market?.id ?? null
  const [liveMarket, setLiveMarket] = useState(market)
  const [selectedOptionId, setSelectedOptionId] = useState(initialSelectedOptionId)
  const [amount, setAmount] = useState('')
  const [err, setErr] = useState('')
  const [timeWindowKey, setTimeWindowKey] = useState('week')
  const [balanceOverride, setBalanceOverride] = useState(null)
  const { submit, reset, status, result, error } = usePlaceBet()
  const {
    series,
    loading: historyLoading,
    error: historyError,
    updatedAt,
  } = useProbabilityHistory(market)

  useEffect(() => {
    if (!marketId) {
      return undefined
    }

    const controller = new AbortController()

    async function fetchLiveMarket() {
      try {
        const res = await fetch(`${BASE_URL}/api/markets/${marketId}`, {
          signal: controller.signal,
        })

        if (!res.ok) {
          return
        }

        const data = await res.json()
        if (data.market) {
          setLiveMarket(data.market)
        }
      } catch {
        // Keep the last known market snapshot if a refresh fails.
      }
    }

    fetchLiveMarket()
    const intervalId = window.setInterval(fetchLiveMarket, LIVE_MARKET_REFRESH_MS)

    return () => {
      controller.abort()
      window.clearInterval(intervalId)
    }
  }, [marketId])

  useEffect(() => {
    function handleKeyDown(event) {
      if (event.key === 'Escape' && status !== BET_STATUS.SUBMITTING) {
        onClose()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [onClose, status])

  if (!market) return null

  const displayMarket = liveMarket?.id === market.id ? liveMarket : market
  const opts = Array.isArray(displayMarket.options) ? displayMarket.options : []
  const haveOptions = opts.length >= 2
  const selectedOption = opts.find((option) => option.id === selectedOptionId)
  const numericAmount = Number(amount)
  const marketPool = Number(displayMarket.total_liquidity || 0)
  const selectedPool = Number(selectedOption?.total_liquidity || 0)
  const selectedWindow = TIME_WINDOWS.find((item) => item.key === timeWindowKey) || TIME_WINDOWS[1]
  const currentBalance = balanceOverride ?? balance
  const estimatedPayout = selectedOption && numericAmount > 0
    ? Math.floor((numericAmount / (selectedPool + numericAmount)) * (marketPool + numericAmount))
    : null

  async function handleSubmit() {
    const num = Number(amount)
    const optionId = selectedOption?.id

    if (!haveOptions) {
      setErr("This market doesn't have enough options yet.")
      return
    }

    if (!selectedOptionId) {
      setErr('Pick an option first.')
      return
    }

    if (!selectedOption || !Number.isInteger(optionId)) {
      setErr('Choose a valid option before placing your bet.')
      return
    }

    if (!amount || Number.isNaN(num) || !Number.isInteger(num) || num < 1) {
      setErr('Type a whole number greater than or equal to 1.')
      return
    }

    if ((currentBalance ?? 0) < num) {
      setErr(`Not enough funds — you can bet up to $${(currentBalance ?? 0)}`)
      return
    }

    setErr('')
    const betResult = await submit({ marketId: Number(market.id), optionId, amount: num })
    if (betResult?.market) {
      setLiveMarket(betResult.market)
    }
    if (typeof betResult?.balance === 'number') {
      setBalanceOverride(betResult.balance)
    }
    if (betResult && onBetSuccess) {
      onBetSuccess(
        market.id,
        betResult.market || displayMarket,
        betResult.chosenOptionId ?? optionId,
        betResult.balance ?? null,
        betResult.positionCount ?? null,
      )
    }
  }

  function handlePlaceAnother() {
    reset()
    setAmount('')
    setErr('')
  }

  return (
    <div className="modal-backdrop" role="dialog" aria-modal="true" onClick={onClose}>
      <div className="modal bet-modal" onClick={(event) => event.stopPropagation()}>
        <div className="modal-header">
          <p className="eyebrow">Place a bet</p>
          <h3>{displayMarket.market_name}</h3>
        </div>

        <div className="bet-modal-grid">
          <div className="bet-modal-pane">
            {status === BET_STATUS.SUCCESS ? (
              <div className="bet-success-panel">
                <p>
                  New balance: <strong>${Number(result.balance || 0).toLocaleString()}</strong>
                </p>
                <div className="success-actions">
                  <button type="button" onClick={handlePlaceAnother} className="primary-button">
                    Place another bet
                  </button>
                  <button type="button" onClick={onClose} className="secondary-button">
                    Done
                  </button>
                </div>
              </div>
            ) : (
              <>
                {!haveOptions ? (
                  <p className="form-message">This market does not have enough options to place a bet right now.</p>
                ) : (
                  <div className="trade-panel">
                    <div className="trade-market-summary">
                      <div className="trade-meta-row">
                        <span>Balance</span>
                        <strong>${Number(currentBalance || 0).toLocaleString()}</strong>
                      </div>
                    </div>

                    <div className="bet-field">
                      <label>Outcome</label>
                      <div className={opts.length > 2 ? 'bet-side-picker many-options' : 'bet-side-picker'}>
                        {opts.map((option) => (
                          <button
                            key={option.id}
                            type="button"
                            className={selectedOptionId === option.id ? 'bet-option active' : 'bet-option'}
                            onClick={() => {
                              setSelectedOptionId(option.id)
                              if (err) setErr('')
                            }}
                          >
                            <span>{option.label}</span>
                            <strong>{marketPool > 0 ? `${Number(option.percent || 0)}%` : '-'}</strong>
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="bet-field">
                      <label>Amount</label>
                      <div className="amount-control">
                        <span>$</span>
                        <input
                          type="number"
                          min="1"
                          step="1"
                          value={amount}
                          onChange={(event) => {
                            setAmount(event.target.value)
                            if (err) setErr('')
                          }}
                          className={err && err.includes('Not enough') ? 'bet-amount-input invalid' : 'bet-amount-input'}
                          aria-invalid={err && err.includes('Not enough') ? 'true' : 'false'}
                          disabled={status === BET_STATUS.SUBMITTING}
                        />
                      </div>
                      <div className="quick-amounts" aria-label="Quick amount choices">
                        {QUICK_AMOUNTS.map((quickAmount) => (
                          <button
                            key={quickAmount}
                            type="button"
                            onClick={() => {
                              setAmount(String(quickAmount))
                              if (err) setErr('')
                            }}
                          >
                            ${quickAmount}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="trade-ticket">
                      <div>
                        <span>Selected</span>
                        <strong>{selectedOption?.label || 'Choose outcome'}</strong>
                      </div>
                      <div>
                        <span>Estimated payout</span>
                        <strong>
                          {estimatedPayout
                            ? `$${Number(estimatedPayout).toLocaleString()}`
                            : '-'}
                        </strong>
                      </div>
                      <div>
                        <span>Stake</span>
                        <strong>
                          {amount && numericAmount > 0
                            ? `$${Number(numericAmount).toLocaleString()}`
                            : '-'}
                        </strong>
                      </div>
                    </div>
                  </div>
                )}

                {status === BET_STATUS.ERROR && error && (
                  <p className="form-error">{error}</p>
                )}

                {err && <p className="form-error">{err}</p>}

                <div className="modal-actions">
                  <button type="button" className="secondary-button" onClick={onClose} disabled={status === BET_STATUS.SUBMITTING}>
                    Cancel
                  </button>
                  <button type="button" className="primary-button" onClick={handleSubmit} disabled={status === BET_STATUS.SUBMITTING}>
                    {status === BET_STATUS.SUBMITTING ? 'Placing...' : 'Place bet'}
                  </button>
                </div>
              </>
            )}
          </div>

          <aside className="bet-chart-pane" aria-label="Probability chart">
            <div className="bet-chart-head">
              <div>
                <p className="eyebrow">Live odds</p>
                <h4>Probability Chart</h4>
              </div>
              {historyLoading && <span className="panel-note">Updating...</span>}
            </div>

            <div className="time-window-tabs" aria-label="Chart time range">
              {TIME_WINDOWS.map((windowOption) => (
                <button
                  key={windowOption.key}
                  type="button"
                  aria-pressed={timeWindowKey === windowOption.key}
                  onClick={() => setTimeWindowKey(windowOption.key)}
                >
                  {windowOption.label}
                </button>
              ))}
            </div>

            <ProbabilityChart
              height={260}
              rangeEndMs={updatedAt}
              series={series}
              theme="dark"
              windowMs={selectedWindow.windowMs}
            />
            {historyError && <p className="form-error">{historyError}</p>}
          </aside>
        </div>
      </div>
    </div>
  )
}

export default PlaceBetModal
