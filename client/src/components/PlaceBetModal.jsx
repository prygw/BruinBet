import { useState } from 'react'

function fakePlaceBet({ amount }) {
  // hardcoded to succeed for now, but should eventually call the API and handle errors appropriately
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        bet: { id: 999, amount },
        balance: 850,
      })
    }, 400)
  })
}

function PlaceBetModal({ market, onClose }) {
    const [bettingOnChoice, setBettingOnChoice] = useState(null)
    const [amount, setAmount] = useState('')
    const [submitting, setSubmitting] = useState(false)
    const [successInfo, setSuccessInfo] = useState(null)

    if (!market) {
        return null
    }

    const options = Array.isArray(market.options) ? market.options : []
    const optionA = options[0]
    const optionB = options[1]
    const hasOptions = Boolean(optionA && optionB)
    const canPlaceBet = hasOptions && bettingOnChoice && Number(amount) >= 1

    async function handleSubmit() {
        const chosenOption = options.find((o) => o.label === bettingOnChoice)
        if (!chosenOption) {
            return
        }

        setSubmitting(true)
        const data = await fakePlaceBet({
            marketId: market.id,
            optionId: chosenOption.id,
            amount: Number(amount),
        })
        setSuccessInfo({ balance: data.balance })
        setSubmitting(false)
    }

    return (
        <div className="modal-backdrop" role="dialog" aria-modal="true" onClick={onClose}>
            <div className="modal" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                    <p className="eyebrow">Place a bet</p>
                    <h3>{market.market_name}</h3>
                </div>

                {successInfo ? (
                    <>
                        <p className="form-message">Bet placed! New balance: <strong>{successInfo.balance}</strong></p>
                        <div className="modal-actions">
                            <button type="button" className="primary-button" onClick={onClose}>
                                Done
                            </button>
                        </div>
                    </>
                ) : (
                    <>
                        {!hasOptions ? (
                            <p className="form-message">This market does not have enough options to place a bet right now.</p>
                        ) : (
                            <div className="bet-grid">
                                <div className="bet-field">
                                    <label>Choose a side</label>
                                    <div className="bet-side-picker">
                                        <button
                                            type="button"
                                            className={bettingOnChoice === optionA.label ? 'bet-option active' : 'bet-option'}
                                            onClick={() => setBettingOnChoice(optionA.label)}
                                        >
                                            {optionA.label}
                                        </button>
                                        <button
                                            type="button"
                                            className={bettingOnChoice === optionB.label ? 'bet-option active' : 'bet-option'}
                                            onClick={() => setBettingOnChoice(optionB.label)}
                                        >
                                            {optionB.label}
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
                                        onChange={(e) => setAmount(e.target.value)}
                                        disabled={submitting}
                                    />
                                </div>
                            </div>
                        )}

                        <div className="modal-actions">
                            <button type="button" className="secondary-button" onClick={onClose} disabled={submitting}>
                                Cancel
                            </button>
                            <button type="button" className="primary-button" onClick={handleSubmit} disabled={submitting || !canPlaceBet}>
                                {submitting ? 'Placing...' : 'Place bet'}
                            </button>
                        </div>
                    </>
                )}
            </div>
        </div>
    )
}

export default PlaceBetModal
