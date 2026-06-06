import { useState } from 'react'
import BASE_URL from '../api'
import { getStoredSession } from '../utils/session'

// one status instead of isLoading / isError / isSuccess all floating around
export const BET_STATUS = {
    NOTACTIVE: 'notactive',
    SUBMITTING: 'submitting',
    SUCCESS: 'success',
    ERROR: 'error',
}

// just sends the bet and gives back the data (or throws)
async function placeBet({ token, marketId, optionId, amount }) {
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
        // use the server's message if it sent one, way more helpful than "failed"
        throw new Error(data.error || 'Bet failed')
    }

    return typeof data.position_count === 'number'
        ? { ...data, positionCount: data.position_count }
        : data
}

// grabs one market so we can show the latest split after a bet --> throws if it's bad, and whoever calls it decides if that's a big deal (down in submit it's not)
async function fetchMarket({ token, marketId }) {
    const res = await fetch(`${BASE_URL}/api/markets/${marketId}`, {
        headers: { Authorization: `Bearer ${token}` },
    })

    if (!res.ok) {
        throw new Error('Could not load market')
    }

    const data = await res.json()
    return data.market
}

// takes the raw market and adds a % to each option for the split bar
// pure function (same in -> same out, no side effects) so it's easy to test and won't surprise anyone
// does math for every option not just the chosen one bc the bar shows the whole market's options and their distributions
function buildMarketDistribution(market, chosenOptionId) {
    const total = market.options.reduce((sum, o) => sum + (o.total_liquidity || 0), 0)

    const options = market.options.map((o) => {
        const liquidity = o.total_liquidity || 0
        // total can be 0 on a brand new market, don't divide by it
        const percent = total > 0 ? Number(((liquidity / total) * 100).toFixed(1)) : 0
        return { ...o, percent }
    })

    const chosen = options.find((o) => o.id === chosenOptionId)

    return {
        market: { ...market, options },
        chosenOptionId,
        chosenLabel: chosen ? chosen.label : undefined,
    }
}

export function usePlaceBet() {
    const [status, setStatus] = useState(BET_STATUS.NOTACTIVE)
    const [error, setError] = useState('')
    const [result, setResult] = useState(null)

    // error + status are kind of the same thing ("we failed and here's why") so set them together, that way you can't end up with an error status but an old message or the other way around
    function fail(message) {
        setError(message)
        setStatus(BET_STATUS.ERROR)
    }

    async function submit({ marketId, optionId, amount }) {
        // clear the old error and flip to submitting right away
        setError('')
        setStatus(BET_STATUS.SUBMITTING)

        const stored = getStoredSession()
        const token = stored && stored.token

        if (!token) {
            fail('Not authenticated')
            return null
        }

        if (!Number.isInteger(marketId) || !Number.isInteger(optionId)) {
            fail('Could not place bet: invalid market or option selected.')
            return null
        }

        if (!Number.isInteger(amount) || amount <= 0) {
            fail('Could not place bet: amount must be a whole number greater than zero.')
            return null
        }

        try {
            const data = await placeBet({ token, marketId, optionId, amount })

            // getting the market is just so we can draw the split, it's not important, so its own try/catch and if it fails we just use the plain response because we don't want to show an error when the bet actually worked
            let finalResult = data
            try {
                const market = await fetchMarket({ token, marketId })
                if (market && Array.isArray(market.options)) {
                    finalResult = { ...data, ...buildMarketDistribution(market, optionId) }
                }
            } catch {
                // ignore on purpose, just keep the basic response
            }

            setResult(finalResult)
            setStatus(BET_STATUS.SUCCESS)
            return finalResult
        } catch (err) {
            // this only catches the bet POST, so if we're here the bet really didn't go through
            fail(err.message || 'Could not place bet')
            return null
        }
    }

    // reset back to clean, like after the user closes the result popup
    function reset() {
        setStatus(BET_STATUS.NOTACTIVE)
        setError('')
        setResult(null)
    }

    return { submit, reset, status, error, result }
}
