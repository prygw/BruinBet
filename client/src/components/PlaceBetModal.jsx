import { useState } from 'react'
import { usePlaceBet, BET_STATUS } from '../hooks/usePlaceBet'

function PlaceBetModal({ market, balance, onClose }) {
    const [choice, setChoice] = useState(null)
    const [amount, setAmount] = useState('')
    const [err, setErr] = useState('')
    const { submit, status, result, error } = usePlaceBet()

    if (!market) return null

    const opts = Array.isArray(market.options) ? market.options : []
    const a = opts[0]
    const b = opts[1]
    const haveOptions = Boolean(a && b)

    async function handleSubmit() {
        const num = parseFloat(amount)

        if (!haveOptions) {
            setErr("This market doesn't have two options yet.")
            return
        }

        if (!choice) {
            setErr('Pick an option first.')
            return
        }

        if (!amount || Number.isNaN(num) || num < 1) {
            setErr('Type a number >= 1')
            return
        }

        if ((balance ?? 0) < num) {
            setErr(`Not enough funds — you can bet up to $${(balance ?? 0)}`)
            return
        }

        setErr('')
        await submit({ marketId: market.id, optionId: (opts.find((o) => o.label === choice) || {}).id, amount: num })
    }

    return (
        <div className="modal-backdrop" role="dialog" aria-modal="true" onClick={onClose}>
            <div className="modal" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                    <p className="eyebrow">Place a bet</p>
                    <h3>{market.market_name}</h3>
                </div>

                {status === BET_STATUS.SUCCESS ? (
                    <>
                        <p className="form-message">Bet placed! New balance: <strong>{result.balance}</strong></p>
                        <div className="modal-actions">
                            <button type="button" className="primary-button" onClick={onClose}>
                                Done
                            </button>
                        </div>
                    </>
                ) : (
                    <>
                        {!haveOptions ? (
                            <p className="form-message">This market does not have enough options to place a bet right now.</p>
                        ) : (
                            <div className="bet-grid">
                                <div className="bet-field">
                                    <label>Choose an option</label>
                                    <div className="bet-side-picker">
                                        <button
                                            type="button"
                                            className={choice === a?.label ? 'bet-option active' : 'bet-option'}
                                            onClick={() => { setChoice(a?.label); if (err) setErr('') }}
                                        >
                                            {a?.label}
                                        </button>
                                        <button
                                            type="button"
                                            className={choice === b?.label ? 'bet-option active' : 'bet-option'}
                                            onClick={() => { setChoice(b?.label); if (err) setErr('') }}
                                        >
                                            {b?.label}
                                        </button>
                                    </div>
                                </div>

                                <div className="bet-field">
                                    <label>Amount</label>
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
