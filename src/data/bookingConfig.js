export const BOOKING_API_URL = "https://script.google.com/macros/s/AKfycbz2YjonaQjCAQrE_dNoa2h-7tozAI6cGGnaGxUnrJvN_fX0O66JCNBmMwp6UYcfRar32w/exec"

export const BOOKING_CONFIG = {
  operatingDays: [1, 2, 3, 4, 5],
  operatingHours: {
    start: { hour: 9, minute: 0 },
    end: { hour: 16, minute: 0 }
  },
  playTime: '45 Minutes',
  sessionDuration: 45,
  maxCapacity: 5,
  slotStartTimes: [
    9 * 60,
    9 * 60 + 45,
    10 * 60 + 30,
    11 * 60 + 15,
    12 * 60,
    12 * 60 + 45,
    13 * 60 + 30,
    14 * 60 + 15,
    15 * 60
  ]
}

export function isBookingApiConfigured() {
  return Boolean(BOOKING_API_URL)
}

export function generateSlotsForDate(date, availability = {}) {
  const { operatingDays, slotStartTimes } = BOOKING_CONFIG
  const availabilityBySlot = normalizeAvailability(availability)

  if (!date || !operatingDays.includes(date.getDay()) || Object.keys(availabilityBySlot).length === 0) {
    return []
  }

  return slotStartTimes.reduce((slots, minutes, index) => {
    const time = formatTime(minutes)
    const slotAvailability = availabilityBySlot[time]
    if (!slotAvailability) return slots

    const available = Math.max(Number(slotAvailability.available), 0)

    slots.push({
      index,
      time,
      available,
      maxCapacity: BOOKING_CONFIG.maxCapacity,
      status: slotAvailability.status
    })

    return slots
  }, [])
}

export async function fetchSlotAvailability(date) {
  if (!isBookingApiConfigured()) return {}

  const url = new URL(BOOKING_API_URL)
  url.searchParams.set('date', formatDateKey(date))

  const response = await fetch(url.toString(), {
    method: 'GET',
    headers: { Accept: 'application/json' }
  })

  if (!response.ok) {
    throw new Error('Unable to load slot availability.')
  }

  return parseJsonResponse(response)
}

export async function submitBooking(booking) {
  if (!isBookingApiConfigured()) {
    return {
      status: 'validation_error',
      message: 'Booking system is not connected yet. Please add the Google Apps Script Web App URL.'
    }
  }

  const response = await fetch(BOOKING_API_URL, {
    method: 'POST',
    headers: { Accept: 'application/json' },
    body: JSON.stringify(booking)
  })

  if (!response.ok) {
    throw new Error('Unable to submit booking request.')
  }

  return parseJsonResponse(response)
}

async function parseJsonResponse(response) {
  const text = await response.text()

  try {
    return JSON.parse(text)
  } catch {
    throw new Error('Unexpected API response.')
  }
}

function normalizeAvailability(availability) {
  if (Array.isArray(availability)) {
    return availability.reduce((slots, item, index) => {
      const slot = normalizeSlotLabel(item?.slot, index)
      if (!slot) return slots
      const isFull = String(item.status || '').toUpperCase() === 'FULLY BOOKED'
      const available = isFull ? 0 : Number(item.available ?? 0)
      slots[slot] = {
        available,
        status: isFull ? 'full' : getSlotStatus(available)
      }
      return slots
    }, {})
  }

  return Object.entries(availability || {}).reduce((slots, [slot, value]) => {
    if (typeof value === 'object' && value !== null) {
      const isFull = String(value.status || '').toUpperCase() === 'FULLY BOOKED'
      const available = isFull ? 0 : Number(value.available ?? 0)
      slots[slot] = {
        available,
        status: isFull ? 'full' : getSlotStatus(available)
      }
    } else {
      const bookedCount = Number(value || 0)
      const available = Math.max(BOOKING_CONFIG.maxCapacity - bookedCount, 0)
      slots[slot] = { available, status: getSlotStatus(available) }
    }
    return slots
  }, {})
}

function normalizeSlotLabel(slot, index) {
  if (typeof slot === 'string' && /^\d{2}:\d{2}\s[AP]M$/i.test(slot.trim())) {
    return slot.trim().toUpperCase()
  }

  const configuredSlot = BOOKING_CONFIG.slotStartTimes[index]
  return configuredSlot === undefined ? '' : formatTime(configuredSlot)
}

function getSlotStatus(available) {
  if (available <= 0) return 'full'
  if (available <= 2) return 'almost-full'
  return 'available'
}

function formatTime(minutes) {
  const hours = Math.floor(minutes / 60)
  const mins = minutes % 60
  const period = hours >= 12 ? 'PM' : 'AM'
  const displayHours = hours > 12 ? hours - 12 : hours === 0 ? 12 : hours
  const displayMins = mins.toString().padStart(2, '0')
  return `${displayHours.toString().padStart(2, '0')}:${displayMins} ${period}`
}

export function formatDateKey(date) {
  const year = date.getFullYear()
  const month = (date.getMonth() + 1).toString().padStart(2, '0')
  const day = date.getDate().toString().padStart(2, '0')
  return `${year}-${month}-${day}`
}

export function isOperatingDay(date) {
  return BOOKING_CONFIG.operatingDays.includes(date.getDay())
}

export function isPastDate(date) {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const target = new Date(date)
  target.setHours(0, 0, 0, 0)
  return target < today
}

export function getAvailableDates() {
  const dates = []
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  for (let i = 0; i < 30; i++) {
    const date = new Date(today)
    date.setDate(date.getDate() + i)

    if (isOperatingDay(date)) {
      dates.push(new Date(date))
    }
  }

  return dates
}

export function validateBookingData(data) {
  const errors = {}

  if (!data.name || data.name.trim().length < 2) {
    errors.name = 'Please enter your full name'
  }

  if (!data.phone || data.phone.trim().length < 6) {
    errors.phone = 'Please enter your mobile number'
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!data.email || !emailRegex.test(data.email)) {
    errors.email = 'Please enter a valid email address'
  }

  const groupSize = Number(data.groupSize)
  if (!groupSize || groupSize < 1) {
    errors.groupSize = 'Please enter your group size'
  }

  if (!data.date) {
    errors.date = 'Please select a date'
  } else if (isPastDate(data.date)) {
    errors.date = 'Please select today or a future date'
  } else if (!isOperatingDay(data.date)) {
    errors.date = 'Please select a Monday to Friday date'
  }

  if (data.slotIndex === null || data.slotIndex === undefined) {
    errors.slotIndex = 'Please select a slot time'
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors
  }
}

export function formatDateDisplay(date) {
  if (!date) return ''
  const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }
  return date.toLocaleDateString('en-NZ', options)
}

export function getSlotTime(slotIndex) {
  const { slotStartTimes } = BOOKING_CONFIG
  if (slotIndex < 0 || slotIndex >= slotStartTimes.length) return ''
  return formatTime(slotStartTimes[slotIndex])
}
