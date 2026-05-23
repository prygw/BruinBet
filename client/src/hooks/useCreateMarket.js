import { useState } from 'react'
import BASE_URL from '../api'

// Normally this would be part of a more general markets API module, but since it's only used in one place and has some specific state management needs, I've put it in the hook for now
async function createMarket(draft, token) {
    const response = await fetch(`${BASE_URL}/api/markets`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(draft),
    })

    const data = await response.json()
    if (!response.ok) {
        throw new Error(data.error || 'Failed to create market')
    }
    return data.market
}

export function useCreateMarket(token) {
    const [submitting, setSubmitting] = useState(false)
    const [error, setError] = useState('')

    async function submit(draft) {
        setSubmitting(true)
        setError('')

        try {
            const market = await createMarket(draft, token)
            return market
        } catch (err) {
            setError(err.message)
            return null
        } finally {
            setSubmitting(false)
        }
    }

    return { submit, submitting, error }
}
