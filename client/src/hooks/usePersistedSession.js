import { useEffect, useState } from 'react'
import { SESSION_KEY, getStoredSession } from '../utils/session'

export function usePersistedSession() {
    const [session, setSession] = useState(() => getStoredSession())

    useEffect(() => {
        if (session) {
            localStorage.setItem(SESSION_KEY, JSON.stringify(session))
            return
        }

        localStorage.removeItem(SESSION_KEY)
    }, [session])

    return [session, setSession]
}
