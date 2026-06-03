// Paste the deployed Google Apps Script Web App URL here.
// The endpoint should accept POST booking requests and optionally return date availability.
export const BOOKING_API_URL = "PASTE_GOOGLE_APPS_SCRIPT_WEB_APP_URL_HERE"

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
  return Boolean(
    BOOKING_API_URL &&
    BOOKING_API_URL !== 'PASTE_GOOGLE_APPS_SCRIPT_WEB_APP_URL_HERE'
  )
}

export function generateSlotsForDate(date, availability = {}) {
  const { operatingDays, slotStartTimes, maxCapacity } = BOOKING_CONFIG

  if (!date || !operatingDays.includes(date.getDay())) {
    return []
  }

  return slotStartTimes.map((minutes, index) => {
    const time = formatTime(minutes)
    const bookedCount = Number(availability?.[time] || 0)
    const available = Math.max(maxCapacity - bookedCount, 0)

    return {
      index,
      time,
      bookedCount,
      available,
      maxCapacity,
      status: getSlotStatus(available)
    }
  })
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

  return response.json()
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
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(booking)
  })

  if (!response.ok) {
    throw new Error('Unable to submit booking request.')
  }

  return response.json()
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
