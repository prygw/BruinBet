export const SESSION_KEY = 'bruinbet-session'

export function getStoredSession() {
  try {
    const storedSession = localStorage.getItem(SESSION_KEY)
    return storedSession ? JSON.parse(storedSession) : null
  } catch {
    localStorage.removeItem(SESSION_KEY)
    return null
  }
}
