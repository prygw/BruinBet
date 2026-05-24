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

            setResult(data)
            setStatus(BET_STATUS.SUCCESS)
        } catch (err) {
            setError(err.message || 'Could not place bet')
            setStatus(BET_STATUS.ERROR)
        }
    }

    function reset() {
        setStatus(BET_STATUS.NOTACTIVE)
        setError('')
        setResult(null)
    }

    return { submit, reset, status, error, result }
}
