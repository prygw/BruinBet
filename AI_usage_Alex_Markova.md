Here’s my AI prompt for adding the status/distribution bar:

<INITIAL PROMPT START>

Context: I'm working on PlaceBetModal.jsx in a React prediction market app. When a bet succeeds, I already have the success screen built. I want you to add is a market distribution split bar.

Here is my PlaceBetModal.jsx:

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
                                {status === BET_STATUS.SUBMITTING ? 'Placing...' : 'Place bet'}
                            </button>
                        </div>
                    </>
                )}
            </div>
        </div>
    )
}

export default PlaceBetModal


In the success branch, I want you to add a market distribution split bar between the "Bet placed!" text and the Done button. It should be a full-width horizontal bar split into two colored segments sized proportionally to each option's percent. Use UCLA gold (#ffd100) for the first option and UCLA blue (#2774ae) for the second. Highlight the segment the user bet on. Only show the label and percent inline inside a segment if it's wide enough. Include a small legend below with color swatches for both options. The data available on result: result.market.options is an array of { id, label, percent }, and result.chosenOptionId is the id of the option the user picked. Do not change anything else.

If you have any questions beforehand, ask me.


<INITIAL PROMPT END>
<AI RESPONSE 1>
Here are two questions before I dive in:

Should the split bar gracefully hide if result.market or result.market.options isn't available, or can I assume that data is always present on success?
What percentage threshold should I use to decide if a segment is wide enough to show its inline label — do you have a number in mind, or should I pick something reasonable like 10%?
<AI RESPONSE 1 END>
<MY RESPONSE 1>
Hide it if the data isn't there, so just existing text shows.
You do whatever is reasonable for now.
<MY RESPONSE 1 END>
<AI RESPONSE 2>
Here is the full updated file:
jsximport { useState } from 'react'
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

    const FIRST_COLOR = '#ffd100'
    const SECOND_COLOR = '#2774ae'

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
                    (() => {
                        const resultOptions = (result && result.market && result.market.options) || null
                        const first = resultOptions?.[0]
                        const second = resultOptions?.[1]
                        const chosenId = result?.chosenOptionId

                        return (
                            <div style={{ display: 'grid', gap: 18, paddingTop: 4 }}>
                                <p style={{ margin: 0, color: '#cbd5e1', fontSize: 15 }}>
                                    New balance: <strong style={{ color: '#fff', fontSize: 20 }}>{result.balance}</strong>
                                </p>

                                {first && second && (
                                    <div>
                                        <p style={{ margin: '0 0 8px', textTransform: 'uppercase', fontSize: 11, color: '#94a3b8', fontWeight: 800, letterSpacing: 0.5 }}>
                                            Market distribution
                                        </p>

                                        {/* split bar — two segments sized to their % share; chosen side gets outlined */}
                                        <div
                                            role="img"
                                            aria-label={`${first.label} ${first.percent}%, ${second.label} ${second.percent}%`}
                                            style={{
                                                display: 'flex',
                                                height: 42,
                                                borderRadius: 10,
                                                overflow: 'hidden',
                                                border: '1px solid rgba(255,255,255,0.1)',
                                            }}
                                        >
                                            <div
                                                style={{
                                                    width: `${first.percent}%`,
                                                    background: FIRST_COLOR,
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    color: '#111827',
                                                    fontWeight: 800,
                                                    fontSize: 13,
                                                    outline: first.id === chosenId ? '3px solid #fff' : 'none',
                                                    outlineOffset: -3,
                                                    transition: 'width 420ms ease',
                                                    minWidth: first.percent > 0 ? 44 : 0,
                                                }}
                                            >
                                                {first.percent > 8 && `${first.label} ${first.percent}%`}
                                            </div>
                                            <div
                                                style={{
                                                    width: `${second.percent}%`,
                                                    background: SECOND_COLOR,
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    color: '#fff',
                                                    fontWeight: 800,
                                                    fontSize: 13,
                                                    outline: second.id === chosenId ? '3px solid #fff' : 'none',
                                                    outlineOffset: -3,
                                                    transition: 'width 420ms ease',
                                                    minWidth: second.percent > 0 ? 44 : 0,
                                                }}
                                            >
                                                {second.percent > 8 && `${second.label} ${second.percent}%`}
                                            </div>
                                        </div>

                                        {/* legend underneath — in case a segment is too narrow to show its inline label */}
                                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: '#cbd5e1', marginTop: 10 }}>
                                            <span>
                                                <span style={{ display: 'inline-block', width: 10, height: 10, background: FIRST_COLOR, borderRadius: 2, marginRight: 6, verticalAlign: 'middle' }} />
                                                {first.label} — {first.percent}%
                                                {first.id === chosenId && <span style={{ marginLeft: 6, color: '#fff', fontWeight: 700 }}>(your bet)</span>}
                                            </span>
                                            <span>
                                                <span style={{ display: 'inline-block', width: 10, height: 10, background: SECOND_COLOR, borderRadius: 2, marginRight: 6, verticalAlign: 'middle' }} />
                                                {second.label} — {second.percent}%
                                                {second.id === chosenId && <span style={{ marginLeft: 6, color: '#fff', fontWeight: 700 }}>(your bet)</span>}
                                            </span>
                                        </div>
                                    </div>
                                )}

                                <div className="modal-actions">
                                    <button type="button" className="primary-button" onClick={onClose}>
                                        Done
                                    </button>
                                </div>
                            </div>
                        )
                    })()
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
                                {status === BET_STATUS.SUBMITTING ? 'Placing...' : 'Place bet'}
                            </button>
                        </div>
                    </>
                )}
            </div>
        </div>
    )
}

export default PlaceBetModal
<AI RESPONSE 2 END>

My reflection:
AI did well on the split bar logic; it was all correct, matched what I asked for, and looked aesthetically pleasing. It also correctly left most of the modal untouched. The biggest problem with the AI response is that it inlined all the split bar JSX directly in PlaceBetModal rather than extracting it into a reusable component, so in a later commit I refactored it into StatusBar.jsx. I also took the AI code some steps further by adding the logic in so that the StatusBar replaced the “Bet” button.
