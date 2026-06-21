const SESSION_KEY = 'rcc_reward_session'
const REMEMBERED_SESSION_KEY = 'rcc_reward_remembered_session'
const SESSION_DURATION = 12 * 60 * 60 * 1000
const REMEMBERED_DURATION = 30 * 24 * 60 * 60 * 1000

export function createRewardSession(card, remember = false) {
  if (typeof window === 'undefined' || !card) return null
  clearRewardSession()

  const session = {
    cardId: card.cardId,
    token: card.token,
    expiresAt: Date.now() + (remember ? REMEMBERED_DURATION : SESSION_DURATION)
  }
  const storage = remember ? window.localStorage : window.sessionStorage
  storage.setItem(remember ? REMEMBERED_SESSION_KEY : SESSION_KEY, JSON.stringify(session))
  return session
}

export function getRewardSession() {
  if (typeof window === 'undefined') return null
  return readSession(window.sessionStorage, SESSION_KEY) ||
    readSession(window.localStorage, REMEMBERED_SESSION_KEY)
}

export function isRewardSessionAuthorized(card) {
  if (!card) return false
  const session = getRewardSession()
  return Boolean(session && session.token === card.token && session.cardId === card.cardId)
}

export function clearRewardSession() {
  if (typeof window === 'undefined') return
  window.sessionStorage.removeItem(SESSION_KEY)
  window.localStorage.removeItem(REMEMBERED_SESSION_KEY)
}

function readSession(storage, key) {
  try {
    const raw = storage.getItem(key)
    if (!raw) return null
    const session = JSON.parse(raw)
    if (!session.expiresAt || session.expiresAt <= Date.now()) {
      storage.removeItem(key)
      return null
    }
    return session
  } catch {
    storage.removeItem(key)
    return null
  }
}
