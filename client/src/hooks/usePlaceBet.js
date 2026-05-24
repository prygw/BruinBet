import { useState } from 'react'
import BASE_URL from '../api'
import { getStoredSession } from '../utils/session'

export const BET_STATUS = {
    NOTACTIVE: 'notactive',
    SUBMITTING: 'submitting',
    SUCCESS: 'success',
    ERROR: 'error',
}

export function usePlaceBet() {
    const [status, setStatus] = useState(BET_STATUS.NOTACTIVE)
    const [error, setError] = useState('')
    const [result, setResult] = useState(null)

    async function submit({ marketId, optionId, amount }) {
        setStatus(BET_STATUS.SUBMITTING)
        setError('')

        try {
            const stored = getStoredSession()
            const token = stored && stored.token

            if (!token) {
                setError('Not authenticated')
                setStatus(BET_STATUS.ERROR)
                return
            }

            if (!Number.isInteger(marketId) || !Number.isInteger(optionId)) {
                setError('Could not place bet: invalid market or option selected.')
                setStatus(BET_STATUS.ERROR)
                return
            }

            if (!Number.isInteger(amount) || amount <= 0) {
                setError('Could not place bet: amount must be a whole number greater than zero.')
                setStatus(BET_STATUS.ERROR)
                return
            }

            const res = await fetch(`${BASE_URL}/api/bets`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                    market_id: marketId,
                    option_id: optionId,
                    amount,
                }),
            })

            const data = await res.json()
            if (!res.ok) {
                throw new Error(data.error || 'Bet failed')
            }

            // temporarily store basic response
            let finalResult = data

            // fetch updated market data so UI can show distribution
            try {
                const marketRes = await fetch(`${BASE_URL}/api/markets/${marketId}`, {
                    headers: { Authorization: `Bearer ${token}` },
                })
                if (marketRes.ok) {
                    const marketJson = await marketRes.json()
                    const market = marketJson.market
                    if (market && Array.isArray(market.options)) {
                        const total = market.options.reduce((s, o) => s + (o.total_liquidity || 0), 0)

                        // compute % for every option, not just the chosen one
                        // the modal needs both to draw the split bar
                        const optionsWithPct = market.options.map((o) => {
                            const liq = o.total_liquidity || 0
                            const pct = total > 0 ? Number(((liq / total) * 100).toFixed(1)) : 0
                            return { ...o, percent: pct }
                        })

                        const chosen = optionsWithPct.find((o) => o.id === optionId)

                        finalResult = {
                            ...data,
                            market: { ...market, options: optionsWithPct },
                            chosenOptionId: optionId,
                            chosenLabel: chosen ? chosen.label : undefined,
                        }
                    }
                }
            } catch (err2) {
                // ignore; fall back to basic data
            }

            setResult(finalResult)
            setStatus(BET_STATUS.SUCCESS)
            return finalResult
        } catch (err) {
            setError(err.message || 'Could not place bet')
            setStatus(BET_STATUS.ERROR)
            return null
        }
    }

    function reset() {
        setStatus(BET_STATUS.NOTACTIVE)
        setError('')
        setResult(null)
    }

    return { submit, reset, status, error, result }
}
