const CARD_STORAGE_KEY = 'rcc_reward_cards_v2'
const LEGACY_CARD_STORAGE_KEY = 'rcc_reward_demo_cards'
const PROGRAM_STORAGE_KEY = 'rcc_reward_program_v1'
const CARD_START_NUMBER = 1001
const MAX_STAMPS = 7

export const REWARD_MAX_STAMPS = MAX_STAMPS
export const rewardSignupGiftTitle = 'Buy 1 Get 1 Toastie'
export const rewardSignupGiftDescription = 'Enjoy a second toastie on us with your welcome reward.'

const DEFAULT_PROGRAM = {
  signupGift: {
    id: 'welcome-toastie',
    title: rewardSignupGiftTitle,
    description: rewardSignupGiftDescription,
    active: true
  },
  offers: [
    {
      id: 'member-welcome',
      type: 'Buy 1 Get 1',
      title: 'Member Welcome Offer',
      description: 'Show your active reward card at the counter to see current member specials.',
      active: true,
      createdAt: '2026-01-01T00:00:00.000Z'
    }
  ],
  notifications: [
    {
      id: 'show-card',
      title: 'Remember your digital card',
      message: 'Show your QR code at the RCC counter during each eligible visit.',
      active: true,
      createdAt: '2026-01-01T00:00:00.000Z'
    }
  ]
}

export function getRewardCards() {
  if (typeof window === 'undefined') return []

  try {
    const current = window.localStorage.getItem(CARD_STORAGE_KEY)
    if (current) return JSON.parse(current).map(enrichCard)

    const legacy = window.localStorage.getItem(LEGACY_CARD_STORAGE_KEY)
    if (!legacy) return []

    const migrated = JSON.parse(legacy).map((card) => ({
      ...card,
      cardId: normalizeCardId(card.cardId),
      requiresPasswordReset: !card.dobHash
    }))
    saveRewardCards(migrated)
    return migrated.map(enrichCard)
  } catch {
    return []
  }
}

export function getRewardCardByToken(token) {
  return getRewardCards().find((card) => card.token === token) || null
}

export function getRewardCardByCardId(cardId) {
  const normalized = normalizeCardId(cardId)
  return getRewardCards().find((card) => normalizeCardId(card.cardId) === normalized) || null
}

export function authenticateRewardCard(cardId, dob) {
  const card = getRewardCardByCardId(cardId)
  if (!card || !dob || card.requiresPasswordReset) return null
  return card.dobHash === createDobFingerprint(dob) ? card : null
}

export function createRewardCard({ name, phone, dob, email = '' }) {
  const cards = getStoredCards()
  const highestExistingNumber = cards.reduce((highest, card) => {
    const match = normalizeCardId(card.cardId).match(/^RCC(\d+)$/)
    return Math.max(highest, match ? Number(match[1]) : 0)
  }, CARD_START_NUMBER - 1)
  const cardNumber = Math.max(CARD_START_NUMBER, highestExistingNumber + 1)
  const now = new Date().toISOString()
  const program = getRewardProgram()
  const signupGift = program.signupGift?.active ? {
    ...program.signupGift,
    status: 'unlocked',
    unlockedAt: now
  } : null

  const card = {
    id: cryptoId(),
    cardId: `RCC${cardNumber}`,
    token: cryptoId(),
    name: name.trim(),
    phone: phone.trim(),
    email: email.trim(),
    dobHash: createDobFingerprint(dob),
    stampCount: 0,
    cycle: 1,
    rewardStatus: 'collecting',
    signupGift,
    lastStampDate: '',
    createdAt: now,
    updatedAt: now,
    history: [
      ...(signupGift ? [{
        id: cryptoId(),
        type: 'signup_gift_unlocked',
        label: `Welcome Gift Unlocked - ${signupGift.title}`,
        cycle: 1,
        createdAt: now
      }] : []),
      {
        id: cryptoId(),
        type: 'card_created',
        label: 'Reward card created',
        cycle: 1,
        createdAt: now
      }
    ]
  }

  saveRewardCards([card, ...cards])
  return enrichCard(card)
}

export function addRewardStamp(cardId) {
  const cards = getStoredCards()
  let updatedCard = null
  let result = { ok: false, message: 'Card not found.' }
  const today = getAucklandDateKey()

  const updatedCards = cards.map((card) => {
    if (normalizeCardId(card.cardId) !== normalizeCardId(cardId)) return card

    if (card.rewardStatus === 'unlocked') {
      updatedCard = card
      result = { ok: false, message: 'The reward is unlocked. Redeem it before starting a new cycle.' }
      return card
    }

    if (card.lastStampDate === today) {
      updatedCard = card
      result = { ok: false, message: 'A stamp has already been added to this card today.' }
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
  return { ...result, card: updatedCard ? enrichCard(updatedCard) : null }
}

export function redeemReward(cardId) {
  const cards = getStoredCards()
  let updatedCard = null
  let result = { ok: false, message: 'Card not found.' }

  const updatedCards = cards.map((card) => {
    if (normalizeCardId(card.cardId) !== normalizeCardId(cardId)) return card

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
    result = { ok: true, message: 'Reward redeemed. A new stamp cycle has started.' }
    return updatedCard
  })

  saveRewardCards(updatedCards)
  return { ...result, card: updatedCard ? enrichCard(updatedCard) : null }
}

export function getRewardProgram() {
  if (typeof window === 'undefined') return cloneProgramDefaults()
  try {
    const raw = window.localStorage.getItem(PROGRAM_STORAGE_KEY)
    return raw ? { ...cloneProgramDefaults(), ...JSON.parse(raw) } : cloneProgramDefaults()
  } catch {
    return cloneProgramDefaults()
  }
}

export function addRewardOffer({ type, title, description }) {
  const program = getRewardProgram()
  program.offers = [{
    id: cryptoId(),
    type,
    title: title.trim(),
    description: description.trim(),
    active: true,
    createdAt: new Date().toISOString()
  }, ...(program.offers || [])]
  saveRewardProgram(program)
  return program
}

export function addRewardNotification({ title, message }) {
  const program = getRewardProgram()
  program.notifications = [{
    id: cryptoId(),
    title: title.trim(),
    message: message.trim(),
    active: true,
    createdAt: new Date().toISOString()
  }, ...(program.notifications || [])]
  saveRewardProgram(program)
  return program
}

export function updateSignupGift({ title, description }) {
  const program = getRewardProgram()
  program.signupGift = {
    ...program.signupGift,
    title: title.trim(),
    description: description.trim(),
    active: true
  }
  saveRewardProgram(program)
  return program
}

export function seedDemoRewardCard() {
  const existingCards = getStoredCards()
  const now = new Date().toISOString()
  const demoCard = {
    id: 'demo-reward-card',
    cardId: 'RCC1001',
    token: 'demo',
    name: 'RCC Guest',
    phone: '021 000 0000',
    email: 'guest@example.com',
    dobHash: createDobFingerprint('2000-01-01'),
    stampCount: 3,
    cycle: 1,
    rewardStatus: 'collecting',
    signupGift: null,
    lastStampDate: '',
    createdAt: now,
    updatedAt: now,
    history: [
      { id: cryptoId(), type: 'stamp_added', label: 'Stamp added', cycle: 1, stampCount: 3, createdAt: now },
      { id: cryptoId(), type: 'card_created', label: 'Reward card created', cycle: 1, createdAt: now }
    ]
  }

  saveRewardCards([
    demoCard,
    ...existingCards.filter((card) => normalizeCardId(card.cardId) !== 'RCC1001' && card.token !== 'demo')
  ])
  return enrichCard(demoCard)
}

export function getRewardCardUrl(card) {
  if (typeof window === 'undefined') return `/rewards/card/${encodeURIComponent(card.token)}`
  return `${window.location.origin}/rewards/card/${encodeURIComponent(card.token)}`
}

function getStoredCards() {
  if (typeof window === 'undefined') return []
  try {
    const raw = window.localStorage.getItem(CARD_STORAGE_KEY)
    if (raw) return JSON.parse(raw)
    return getRewardCards().map(stripRuntimeData)
  } catch {
    return []
  }
}

function enrichCard(card) {
  const program = getRewardProgram()
  return {
    ...card,
    activeOffers: (program.offers || []).filter((offer) => offer.active),
    notifications: (program.notifications || []).filter((notification) => notification.active)
  }
}

function stripRuntimeData(card) {
  const { activeOffers, notifications, ...storedCard } = card
  return storedCard
}

function saveRewardCards(cards) {
  if (typeof window === 'undefined') return
  window.localStorage.setItem(CARD_STORAGE_KEY, JSON.stringify(cards.map(stripRuntimeData)))
}

function saveRewardProgram(program) {
  if (typeof window === 'undefined') return
  window.localStorage.setItem(PROGRAM_STORAGE_KEY, JSON.stringify(program))
}

function normalizeCardId(value) {
  return String(value || '').trim().toUpperCase().replace(/[\s-]+/g, '')
}

function createDobFingerprint(value) {
  const input = `rcc-reward:${String(value || '').trim()}`
  let hash = 2166136261
  for (let index = 0; index < input.length; index += 1) {
    hash ^= input.charCodeAt(index)
    hash = Math.imul(hash, 16777619)
  }
  return `v1-${(hash >>> 0).toString(16)}`
}

function cloneProgramDefaults() {
  return JSON.parse(JSON.stringify(DEFAULT_PROGRAM))
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
