const STORAGE_KEY = 'rcc_reward_demo_cards'
const CARD_START_NUMBER = 1001
const MAX_STAMPS = 7

export const REWARD_MAX_STAMPS = MAX_STAMPS

export function getRewardCards() {
  if (typeof window === 'undefined') return []

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

export function getRewardCardByToken(token) {
  return getRewardCards().find((card) => card.token === token) || null
}

export function getRewardCardByCardId(cardId) {
  const normalized = normalizeCardId(cardId)
  return getRewardCards().find((card) => card.cardId.toLowerCase() === normalized.toLowerCase()) || null
}

export function createRewardCard({ name, phone, email }) {
  const cards = getRewardCards()
  const cardNumber = CARD_START_NUMBER + cards.length
  const card = {
    id: cryptoId(),
    cardId: `RCC-${cardNumber}`,
    token: cryptoId(),
    name: name.trim(),
    phone: phone.trim(),
    email: email.trim(),
    stampCount: 0,
    cycle: 1,
    rewardStatus: 'collecting',
    lastStampDate: '',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    history: [
      {
        id: cryptoId(),
        type: 'card_created',
        label: 'Reward card created',
        cycle: 1,
        createdAt: new Date().toISOString()
      }
    ]
  }

  saveRewardCards([card, ...cards])
  return card
}

export function addRewardStamp(cardId) {
  const cards = getRewardCards()
  const today = getAucklandDateKey()
  let updatedCard = null
  let result = { ok: false, message: 'Card not found.' }

  const updatedCards = cards.map((card) => {
    if (card.cardId.toLowerCase() !== normalizeCardId(cardId).toLowerCase()) return card

    if (card.rewardStatus === 'unlocked') {
      updatedCard = card
      result = { ok: false, message: 'Reward is already unlocked. Redeem it before starting a new cycle.' }
      return card
    }

    if (card.lastStampDate === today) {
      updatedCard = card
      result = { ok: false, message: 'A stamp has already been added for this card today.' }
      return card
    }

    const stampCount = Math.min(Number(card.stampCount || 0) + 1, MAX_STAMPS)
    const rewardStatus = stampCount >= MAX_STAMPS ? 'unlocked' : 'collecting'
    updatedCard = {
      ...card,
      stampCount,
      rewardStatus,
      lastStampDate: today,
      updatedAt: new Date().toISOString(),
      history: [
        {
          id: cryptoId(),
          type: 'stamp_added',
          label: rewardStatus === 'unlocked' ? 'Stamp added - Surprise Gift Unlocked' : 'Stamp added',
          cycle: card.cycle,
          stampCount,
          createdAt: new Date().toISOString()
        },
        ...(card.history || [])
      ]
    }
    result = {
      ok: true,
      message: rewardStatus === 'unlocked' ? 'Surprise Gift Unlocked.' : 'Stamp added successfully.'
    }
    return updatedCard
  })

  saveRewardCards(updatedCards)
  return { ...result, card: updatedCard }
}

export function redeemReward(cardId) {
  const cards = getRewardCards()
  let updatedCard = null
  let result = { ok: false, message: 'Card not found.' }

  const updatedCards = cards.map((card) => {
    if (card.cardId.toLowerCase() !== normalizeCardId(cardId).toLowerCase()) return card

    if (card.rewardStatus !== 'unlocked') {
      updatedCard = card
      result = { ok: false, message: 'Reward is not unlocked yet.' }
      return card
    }

    updatedCard = {
      ...card,
      stampCount: 0,
      cycle: Number(card.cycle || 1) + 1,
      rewardStatus: 'collecting',
      lastStampDate: '',
      updatedAt: new Date().toISOString(),
      history: [
        {
          id: cryptoId(),
          type: 'reward_redeemed',
          label: 'Surprise Gift redeemed - new cycle started',
          cycle: card.cycle,
          createdAt: new Date().toISOString()
        },
        ...(card.history || [])
      ]
    }
    result = { ok: true, message: 'Reward redeemed. New cycle started.' }
    return updatedCard
  })

  saveRewardCards(updatedCards)
  return { ...result, card: updatedCard }
}

export function seedDemoRewardCard() {
  const existingCards = getRewardCards()

  const demoCard = {
    id: cryptoId(),
    cardId: 'RCC-1001',
    token: 'demo-card',
    name: 'RCC Guest',
    phone: '09 558 7570',
    email: 'demo@rccafe.co.nz',
    stampCount: 3,
    cycle: 1,
    rewardStatus: 'collecting',
    lastStampDate: '',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    history: [
      {
        id: cryptoId(),
        type: 'stamp_added',
        label: 'Stamp added',
        cycle: 1,
        stampCount: 3,
        createdAt: new Date().toISOString()
      },
      {
        id: cryptoId(),
        type: 'stamp_added',
        label: 'Stamp added',
        cycle: 1,
        stampCount: 2,
        createdAt: new Date(Date.now() - 86400000).toISOString()
      },
      {
        id: cryptoId(),
        type: 'card_created',
        label: 'Reward card created',
        cycle: 1,
        createdAt: new Date(Date.now() - 172800000).toISOString()
      }
    ]
  }

  saveRewardCards([demoCard, ...existingCards.filter((card) => card.cardId !== 'RCC-1001' && card.token !== 'demo-card')])
  return demoCard
}

export function getRewardCardUrl(card) {
  return `${window.location.origin}/rewards/card/${encodeURIComponent(card.token)}`
}

function saveRewardCards(cards) {
  if (typeof window === 'undefined') return
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(cards))
}

function normalizeCardId(value) {
  return String(value || '').trim()
}

function cryptoId() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID()
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`
}

function getAucklandDateKey() {
  const parts = new Intl.DateTimeFormat('en-NZ', {
    timeZone: 'Pacific/Auckland',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }).formatToParts(new Date())
  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]))
  return `${values.year}-${values.month}-${values.day}`
}
