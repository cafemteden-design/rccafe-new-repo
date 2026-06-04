export const BOOKING_API_URL = "https://script.google.com/macros/s/AKfycbz2YjonaQjCAQrE_dNoa2h-7tozAI6cGGnaGxUnrJvN_fX0O66JCNBmMwp6UYcfRar32w/exec"

export const BOOKING_CONFIG = {
  operatingDays: [1, 2, 3, 4, 5],
  operatingHours: {
    start: { hour: 9, minute: 0 },
    end: { hour: 16, minute: 0 }
  },
  maxCapacity: 5,
  defaultSlotDuration: 45
}

export function isBookingApiConfigured() {
  return Boolean(BOOKING_API_URL)
}

export function generateSlotsForDate(date, availability = {}, durationMinutes = BOOKING_CONFIG.defaultSlotDuration) {
  const { operatingDays } = BOOKING_CONFIG
  const availabilityBySlot = normalizeAvailability(availability)
  const slotDuration = Number(durationMinutes) || BOOKING_CONFIG.defaultSlotDuration

  if (!date || !operatingDays.includes(date.getDay()) || slotDuration <= 0) {
    return []
  }

  const startMinutes = BOOKING_CONFIG.operatingHours.start.hour * 60 + BOOKING_CONFIG.operatingHours.start.minute
  const endMinutes = BOOKING_CONFIG.operatingHours.end.hour * 60 + BOOKING_CONFIG.operatingHours.end.minute
  const slotStartTimes = []

  for (let minutes = startMinutes; minutes + slotDuration <= endMinutes; minutes += slotDuration) {
    slotStartTimes.push(minutes)
  }

  return slotStartTimes.map((minutes, index) => {
    const startTime = formatTime(minutes)
    const endTime = formatTime(minutes + slotDuration)
    const slotAvailability = availabilityBySlot[startTime] || availabilityBySlot[`${startTime} - ${endTime}`]
    const available = Math.max(Number(slotAvailability?.available ?? BOOKING_CONFIG.maxCapacity), 0)

    return {
      index,
      time: `${startTime} - ${endTime}`,
      startTime,
      endTime,
      durationMinutes: slotDuration,
      available,
      maxCapacity: BOOKING_CONFIG.maxCapacity,
      status: slotAvailability?.status || getSlotStatus(available)
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

  return parseJsonResponse(response)
}

export async function submitBooking(booking) {
  if (!isBookingApiConfigured()) {
    return {
      status: 'validation_error',
      message: 'Booking system is not connected yet. Please add the Google Apps Script Web App URL.'
    }
  }

  const payload = normalizeBookingPayload(booking)

  const response = await fetch(BOOKING_API_URL, {
    method: 'POST',
    headers: { Accept: 'application/json' },
    body: JSON.stringify(payload)
  })

  if (!response.ok) {
    throw new Error('Unable to submit booking request.')
  }

  return parseJsonResponse(response)
}

function normalizeBookingPayload(booking) {
  const phone = String(booking?.phone || booking?.customerPhone || booking?.userPhone || '').trim()

  return {
    ...booking,
    phone,
    customerPhone: phone,
    userPhone: phone,
    mobile: phone,
    mobileNumber: phone
  }
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
  if (!Array.isArray(availability) && Array.isArray(availability?.value)) {
    return normalizeAvailability(availability.value)
  }

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

  const configuredSlot = getDefaultSlotStartTimes()[index]
  return configuredSlot === undefined ? '' : formatTime(configuredSlot)
}

function getSlotStatus(available) {
  if (available <= 0) return 'full'
  if (available <= 2) return 'almost-full'
  return 'available'
}

function getDefaultSlotStartTimes() {
  const startMinutes = BOOKING_CONFIG.operatingHours.start.hour * 60 + BOOKING_CONFIG.operatingHours.start.minute
  const endMinutes = BOOKING_CONFIG.operatingHours.end.hour * 60 + BOOKING_CONFIG.operatingHours.end.minute
  const slots = []

  for (let minutes = startMinutes; minutes + BOOKING_CONFIG.defaultSlotDuration <= endMinutes; minutes += BOOKING_CONFIG.defaultSlotDuration) {
    slots.push(minutes)
  }

  return slots
}

export function formatTime(minutes) {
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
  const today = getAucklandToday()
  const target = new Date(date)
  target.setHours(0, 0, 0, 0)
  return target < today
}

export function getAvailableDates() {
  const dates = []
  const today = getAucklandToday()

  for (let i = 0; i < 30; i++) {
    const date = new Date(today)
    date.setDate(date.getDate() + i)

    if (isOperatingDay(date)) {
      dates.push(new Date(date))
    }
  }

  return dates
}

export function getAucklandToday() {
  const parts = new Intl.DateTimeFormat('en-NZ', {
    timeZone: 'Pacific/Auckland',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }).formatToParts(new Date())

  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]))
  return new Date(Number(values.year), Number(values.month) - 1, Number(values.day))
}

export function validateBookingData(data) {
  const errors = {}

  if (!data.name || data.name.trim().length < 2) {
    errors.name = 'Please enter your full name'
  }

  if (!data.phone || data.phone.trim().length < 6) {
    errors.phone = 'Please enter your phone number'
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

  if (!data.confirmAttendance) {
    errors.confirmAttendance = 'Please confirm your attendance before reserving your slot'
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
  const slotStartTimes = getDefaultSlotStartTimes()
  if (slotIndex < 0 || slotIndex >= slotStartTimes.length) return ''
  return formatTime(slotStartTimes[slotIndex])
}
