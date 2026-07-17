// Google Sheets is an optional backup channel. Supabase remains the booking authority.
import { BOOKING_DRINK_CHOICES } from './menu.js'

export const BOOKING_API_URL = String(import.meta.env.VITE_GOOGLE_SCRIPT_URL || '').trim()
export const BOOKING_DRINK_VALUES = BOOKING_DRINK_CHOICES

export const BOOKING_CONFIG = {
  operatingDays: [0, 1, 2, 3, 4, 5, 6],
  operatingHours: {
    start: { hour: 9, minute: 0 },
    end: { hour: 17, minute: 0 }
  },
  maxCapacity: 8,
  maximumGroupSize: 8,
  slotCount: 8,
  slotDuration: 60,
  defaultSlotDuration: 60
}

export function isBookingApiConfigured() {
  return Boolean(BOOKING_API_URL)
}

export function generateSlotsForDate(date, availability = {}, durationMinutes = BOOKING_CONFIG.defaultSlotDuration, runtimeConfig = BOOKING_CONFIG) {
  const config = { ...BOOKING_CONFIG, ...runtimeConfig }
  const { operatingDays } = config
  const availabilityBySlot = normalizeAvailability(availability, config.maxCapacity)
  const slotDuration = Number(durationMinutes) || BOOKING_CONFIG.defaultSlotDuration

  if (!date || !operatingDays.includes(date.getDay()) || slotDuration <= 0) {
    return []
  }

  const startMinutes = config.operatingHours.start.hour * 60 + config.operatingHours.start.minute
  const endMinutes = config.operatingHours.end.hour * 60 + config.operatingHours.end.minute
  const slotStartTimes = []

  const slotInterval = Number(config.slotDuration || config.defaultSlotDuration || slotDuration)
  const slotCount = Number(config.slotCount || 8)
  for (let minutes = startMinutes; slotStartTimes.length < slotCount && minutes + slotDuration <= endMinutes; minutes += slotInterval) {
    slotStartTimes.push(minutes)
  }

  return slotStartTimes.map((minutes, index) => {
    const startTime = formatTime(minutes)
    const endTime = formatTime(minutes + slotDuration)
    const slotAvailability = availabilityBySlot[startTime] || availabilityBySlot[`${startTime} - ${endTime}`]
    const available = clampAvailability(slotAvailability?.available ?? config.maxCapacity, config.maxCapacity)

    return {
      index,
      time: `${startTime} - ${endTime}`,
      startTime,
      endTime,
      durationMinutes: slotDuration,
      available,
      maxCapacity: config.maxCapacity,
      status: slotAvailability?.status || getSlotStatus(available)
    }
  })
}

export async function fetchSlotAvailability(date) {
  if (!isBookingApiConfigured()) return {}

  const url = new URL(BOOKING_API_URL)
  url.searchParams.set('action', 'availability')
  url.searchParams.set('date', formatDateKey(date))
  url.searchParams.set('bookingDate', formatDateKey(date))

  debugBooking('availability request', { url: url.toString() })

  const response = await fetch(url.toString(), {
    method: 'GET',
    headers: { Accept: 'application/json' }
  })

  const result = await parseJsonResponse(response)
  debugBooking('availability response', {
    ok: response.ok,
    status: response.status,
    bodyType: Array.isArray(result) ? 'array' : typeof result
  })

  if (!response.ok) {
    throw new Error('Unable to load slot availability.')
  }

  if (result?.success === false) {
    throw new Error(result.message || 'Unable to load slot availability.')
  }

  return result
}

export async function submitBooking(booking) {
  if (!isBookingApiConfigured()) {
    return {
      status: 'validation_error',
      message: 'Booking system is not connected yet. Please add the Google Apps Script Web App URL.'
    }
  }

  const payload = normalizeBookingPayload(booking)
  debugBooking('submit payload', redactBookingForLog(payload))

  const response = await fetch(BOOKING_API_URL, {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'text/plain;charset=utf-8'
    },
    body: JSON.stringify(payload)
  })

  const result = await parseJsonResponse(response)
  debugBooking('submit response', {
    ok: response.ok,
    status: response.status,
    resultStatus: result?.status || result?.result || result?.success,
    message: result?.message || result?.error || ''
  })

  if (!response.ok) {
    throw new Error('Unable to submit booking request.')
  }

  return result
}

function normalizeBookingPayload(booking) {
  const name = String(booking?.name || booking?.customerName || '').trim()
  const email = String(booking?.email || booking?.customerEmail || '').trim()
  const phone = String(booking?.phone || booking?.customerPhone || booking?.userPhone || '').trim()
  const date = String(booking?.date || booking?.bookingDate || '').trim()
  const slotTime = String(booking?.slotTime || booking?.bookingTime || booking?.slot || booking?.time || '').trim()
  const bookingStatus = String(booking?.bookingStatus || booking?.adminStatus || booking?.status || 'Confirmed').trim()
  const packageName = String(booking?.packageName || booking?.package || '').trim()
  const baseDuration = Number(booking?.baseDuration || booking?.packageDuration || 0)
  const extraDuration = Number(booking?.extraDuration || booking?.upgradeDuration || 0)
  const totalPlayTime = String(booking?.totalPlayTime || booking?.playTime || '').trim()
  const basePrice = Number(booking?.basePrice || 0)
  const upgradePrice = Number(booking?.upgradePrice || 0)
  const totalPrice = Number(booking?.totalPrice || booking?.packagePrice || booking?.price || 0)
  const upgradeSelected = String(booking?.upgradeSelected || booking?.upgradeName || 'No Extra Time').trim()
  const toastieSelection = String(booking?.toastieSelection || booking?.toastieChoice || '').trim()
  const drinkSelection = String(booking?.drinkSelection || booking?.coffeeChoice || '').trim()
  const notificationEmails = Array.isArray(booking?.notificationEmails)
    ? booking.notificationEmails
    : String(booking?.notificationEmail || booking?.emailRecipients || booking?.adminEmails || '').split(',').map((email) => email.trim()).filter(Boolean)
  const emailRecipients = notificationEmails.join(',')

  return {
    ...booking,
    action: 'createBooking',
    name,
    customerName: name,
    email,
    customerEmail: email,
    phone,
    customerPhone: phone,
    userPhone: phone,
    mobile: phone,
    mobileNumber: phone,
    date,
    bookingDate: date,
    slotTime,
    bookingTime: slotTime,
    slot: slotTime,
    time: slotTime,
    bookingStatus,
    adminStatus: bookingStatus,
    status: bookingStatus,
    packageName,
    package: packageName,
    baseDuration,
    packageDuration: baseDuration,
    packageDurationMinutes: baseDuration,
    upgradeSelected,
    upgradeName: upgradeSelected,
    extraDuration,
    upgradeDuration: extraDuration,
    totalPlayTime,
    playTime: totalPlayTime,
    basePrice,
    upgradePrice,
    totalPrice,
    packagePrice: totalPrice,
    price: totalPrice,
    groupSize: Number(booking?.groupSize || booking?.players || 0),
    group_size: Number(booking?.groupSize || booking?.players || 0),
    players: Number(booking?.players || booking?.groupSize || 0),
    numberOfPlayers: Number(booking?.players || booking?.groupSize || 0),
    remoteSpots: Number(booking?.groupSize || booking?.players || 0),
    source: booking?.source || 'website',
    toastieSelection,
    toastieChoice: toastieSelection,
    drinkSelection,
    coffeeChoice: drinkSelection,
    notificationEmails,
    notificationEmail: emailRecipients,
    emailRecipients,
    adminEmails: emailRecipients
  }
}

async function parseJsonResponse(response) {
  const text = await response.text()

  try {
    return JSON.parse(text)
  } catch {
    const snippet = text.replace(/\s+/g, ' ').trim().slice(0, 180)
    throw new Error(`Unexpected API response: ${snippet || 'empty response'}`)
  }
}

function debugBooking(label, data) {
  if (import.meta.env.DEV) {
    console.info(`[booking] ${label}`, data)
  }
}

function redactBookingForLog(payload) {
  return {
    ...payload,
    email: payload.email ? '[redacted-email]' : '',
    customerEmail: payload.customerEmail ? '[redacted-email]' : '',
    phone: payload.phone ? '[redacted-phone]' : '',
    customerPhone: payload.customerPhone ? '[redacted-phone]' : '',
    mobile: payload.mobile ? '[redacted-phone]' : '',
    mobileNumber: payload.mobileNumber ? '[redacted-phone]' : ''
  }
}

export function normalizeAvailability(availability, maxCapacity = BOOKING_CONFIG.maxCapacity) {
  if (!Array.isArray(availability) && Array.isArray(availability?.slots)) {
    return normalizeAvailability(availability.slots, maxCapacity)
  }
  if (!Array.isArray(availability) && Array.isArray(availability?.data)) {
    return normalizeAvailability(availability.data, maxCapacity)
  }

  if (!Array.isArray(availability) && Array.isArray(availability?.value)) {
    return normalizeAvailability(availability.value, maxCapacity)
  }

  if (Array.isArray(availability)) {
    return availability.reduce((slots, item, index) => {
      const slot = normalizeSlotLabel(item?.slot || item?.slotTime || item?.time, index)
      if (!slot) return slots
      if (isCancelledBooking(item)) return slots

      const isFull = isFullStatus(item.status) || item.full === true || item.isFull === true
      const explicitAvailable = firstNumericValue(item.available, item.remaining, item.remainingSpots, item.spotsAvailable)
      const explicitUsed = firstNumericValue(item.usedSpots, item.spotsUsed, item.bookedSpots, item.used)

      if (isFull || explicitAvailable !== null || explicitUsed !== null) {
        const available = isFull
          ? 0
          : explicitAvailable !== null
            ? clampAvailability(explicitAvailable, maxCapacity)
            : clampAvailability(maxCapacity - explicitUsed, maxCapacity)
        slots[slot] = {
          available,
          status: isFull ? 'full' : getSlotStatus(available)
        }
        return slots
      }

      const currentAvailable = slots[slot]?.available ?? maxCapacity
      const usedByBooking = getBookingGroupSize(item)
      const available = clampAvailability(currentAvailable - usedByBooking, maxCapacity)
      slots[slot] = { available, status: getSlotStatus(available) }
      return slots
    }, {})
  }

  return Object.entries(availability || {}).reduce((slots, [slot, value]) => {
    if (typeof value === 'object' && value !== null) {
      if (isCancelledBooking(value)) return slots
      const isFull = isFullStatus(value.status) || value.full === true || value.isFull === true
      const explicitAvailable = firstNumericValue(value.available, value.remaining, value.remainingSpots, value.spotsAvailable)
      const explicitUsed = firstNumericValue(value.usedSpots, value.spotsUsed, value.bookedSpots, value.used)
      const available = isFull
        ? 0
        : explicitAvailable !== null
          ? clampAvailability(explicitAvailable, maxCapacity)
          : explicitUsed !== null
            ? clampAvailability(maxCapacity - explicitUsed, maxCapacity)
            : clampAvailability(maxCapacity - getBookingGroupSize(value), maxCapacity)
      slots[slot] = {
        available,
        status: isFull ? 'full' : getSlotStatus(available)
      }
    } else {
      const usedSpots = Number(value || 0)
      const available = clampAvailability(maxCapacity - usedSpots, maxCapacity)
      slots[slot] = { available, status: getSlotStatus(available) }
    }
    return slots
  }, {})
}

function firstNumericValue(...values) {
  const value = values.find((candidate) => candidate !== undefined && candidate !== null && candidate !== '')
  if (value === undefined) return null
  const numeric = Number(value)
  return Number.isFinite(numeric) ? numeric : null
}

function getBookingGroupSize(item) {
  const value = firstNumericValue(
    item?.groupSize,
    item?.group_size,
    item?.players,
    item?.numberOfPlayers,
    item?.remoteSpots,
    item?.spots
  )
  return Math.max(value ?? 1, 1)
}

function isCancelledBooking(item) {
  const status = String(item?.status || item?.bookingStatus || item?.adminStatus || '').trim().toLowerCase()
  return ['cancelled', 'canceled'].includes(status)
}

function isFullStatus(status) {
  const normalized = String(status || '').trim().toUpperCase()
  return normalized === 'FULLY BOOKED' || normalized === 'SOLD OUT' || normalized === 'FULL'
}

function clampAvailability(value, maxCapacity = BOOKING_CONFIG.maxCapacity) {
  return Math.min(Math.max(Number(value) || 0, 0), maxCapacity)
}

function normalizeSlotLabel(slot) {
  if (slot === undefined || slot === null || slot === '') return ''

  const rangeMatch = String(slot).trim().match(/^(\d{1,2}:\d{2}\s[AP]M)\s*[-–]\s*(\d{1,2}:\d{2}\s[AP]M)$/i)
  if (rangeMatch) {
    return `${normalizeSlotLabel(rangeMatch[1])} - ${normalizeSlotLabel(rangeMatch[2])}`
  }

  if (typeof slot === 'string' && /^\d{2}:\d{2}\s[AP]M$/i.test(slot.trim())) {
    return slot.trim().toUpperCase()
  }

  if (typeof slot === 'string' && /^\d{1,2}:\d{2}\s[AP]M$/i.test(slot.trim())) {
    const [time, period] = slot.trim().toUpperCase().split(/\s+/)
    const [hour, minute] = time.split(':')
    return `${hour.padStart(2, '0')}:${minute} ${period}`
  }

  return ''
}

function getSlotStatus(available) {
  if (available <= 0) return 'full'
  if (available <= 2) return 'almost-full'
  return 'available'
}

export function canGroupFitSlot(slot, groupSize, maxCapacity = BOOKING_CONFIG.maxCapacity) {
  const requestedSpots = Number(groupSize)
  return Boolean(
    slot &&
    slot.status !== 'full' &&
    requestedSpots >= 1 &&
    requestedSpots <= maxCapacity &&
    requestedSpots <= Number(slot.available)
  )
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

export function isOperatingDay(date, runtimeConfig = BOOKING_CONFIG) {
  const key = formatDateKey(date)
  const blocked = [...(runtimeConfig.holidayDates || []), ...(runtimeConfig.blackoutDates || [])]
  return runtimeConfig.operatingDays.includes(date.getDay()) && !blocked.includes(key)
}

export function isPastDate(date) {
  const today = getAucklandToday()
  const target = new Date(date)
  target.setHours(0, 0, 0, 0)
  return target < today
}

export function getAvailableDates(runtimeConfig = BOOKING_CONFIG) {
  const dates = []
  const today = getAucklandToday()

  for (let i = 0; i < 30; i++) {
    const date = new Date(today)
    date.setDate(date.getDate() + i)

    if (isOperatingDay(date, runtimeConfig)) {
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

export function validateBookingData(data, runtimeConfig = BOOKING_CONFIG) {
  const errors = {}

  if (!data.name || data.name.trim().length < 2) {
    errors.name = 'Please enter your full name'
  }

  if (!data.phone || !isValidPhone(data.phone)) {
    errors.phone = 'Please enter your phone number'
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!data.email || !emailRegex.test(data.email)) {
    errors.email = 'Please enter a valid email address'
  }

  const groupSize = Number(data.groupSize)
  const maximumGroupSize = Number(runtimeConfig.maximumGroupSize || runtimeConfig.maxCapacity || BOOKING_CONFIG.maxCapacity)
  if (!groupSize || groupSize < 1 || groupSize > maximumGroupSize) {
    errors.groupSize = `Please enter between 1 and ${maximumGroupSize} remote spots`
  }

  if (!data.date) {
    errors.date = 'Please select a date'
  } else if (isPastDate(data.date)) {
    errors.date = 'Please select today or a future date'
  } else if (!isOperatingDay(data.date, runtimeConfig)) {
    errors.date = 'Please select an available booking date'
  }

  if (data.slotIndex === null || data.slotIndex === undefined) {
    errors.slotIndex = 'Please select a slot time'
  }

  if (!data.toastieChoice && !data.toastieSelection) {
    errors.toastieChoice = 'Please select a toastie'
  }

  const drink = data.coffeeChoice || data.drinkSelection
  if (!BOOKING_DRINK_VALUES.includes(drink)) {
    errors.coffeeChoice = 'Please select a valid coffee option'
  }

  if (!data.confirmAttendance) {
    errors.confirmAttendance = 'Please confirm that all booking details are correct'
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors
  }
}

function isValidPhone(value) {
  const digits = String(value || '').replace(/\D/g, '')
  return digits.length >= 6 && digits.length <= 15
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
