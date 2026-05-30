import { useState } from 'react'
import { usePlaceBet, BET_STATUS } from '../hooks/usePlaceBet'
// import StatusBar from './StatusBar'

const QUICK_AMOUNTS = [5, 10, 25, 100]

function PlaceBetModal({ market, balance, onClose, onBetSuccess }) {
    const [selectedOptionId, setSelectedOptionId] = useState(null)
    const [amount, setAmount] = useState('')
    const [err, setErr] = useState('')
    const { submit, status, result, error } = usePlaceBet()

    if (!market) return null

    const opts = Array.isArray(market.options) ? market.options : []
    const haveOptions = opts.length >= 2
    const selectedOption = opts.find((o) => o.id === selectedOptionId)
    const numericAmount = Number(amount)
    const marketPool = Number(market.total_liquidity || 0)
    const selectedPool = Number(selectedOption?.total_liquidity || 0)
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

        if ((balance ?? 0) < num) {
            setErr(`Not enough funds — you can bet up to $${(balance ?? 0)}`)
            return
        }

        setErr('')
        const betResult = await submit({ marketId: Number(market.id), optionId, amount: num })
        if (betResult && betResult.market && onBetSuccess) {
            onBetSuccess(market.id, betResult.market, betResult.chosenOptionId)
        }
    }

    return (
        <div className="modal-backdrop" role="dialog" aria-modal="true" onClick={onClose}>
            <div className="modal" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                    <p className="eyebrow">Place a bet</p>
                    <h3>{market.market_name}</h3>
                </div>

                {status === BET_STATUS.SUCCESS ? (
                    (() => {
                        const resultOptions = (result && result.market && result.market.options) || opts
                        const chosenId = result && result.chosenOptionId

                        return (
                            <div className="bet-success-panel">
                                <p>
                                    New balance: <strong>${Number(result.balance || 0).toLocaleString()}</strong>
                                </p>

                                {/* <StatusBar options={resultOptions} chosenOptionId={chosenId} /> */}

                                <button type="button" onClick={onClose} className="primary-button">
                                    Done
                                </button>
                            </div>
                        )
                    })()
                ) : (
                    <>
                        {!haveOptions ? (
                            <p className="form-message">This market does not have enough options to place a bet right now.</p>
                        ) : (
                            <div className="trade-panel">
                                <div className="trade-market-summary">
                                    {/* <StatusBar options={opts} title="Current probability" /> */}

                                    <div className="trade-meta-row">
                                        <span>Balance</span>
                                        <strong>${Number(balance || 0).toLocaleString()}</strong>
                                    </div>
                                </div>

                                <div className="bet-field">
                                    <label>Outcome</label>
                                    <div className="bet-side-picker">
                                        {opts.map((option) => (
                                            <button
                                                key={option.id}
                                                type="button"
                                                className={selectedOptionId === option.id ? 'bet-option active' : 'bet-option'}
                                                onClick={() => { setSelectedOptionId(option.id); if (err) setErr('') }}
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
                                            onChange={(e) => { setAmount(e.target.value); if (err) setErr('') }}
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
                                {(status === BET_STATUS.SUBMITTING) ? 'Placing...' : 'Place bet'}
                            </button>
                        </div>
                    </>
                )}
            </div>
        </div>
    )
}

export default PlaceBetModal
