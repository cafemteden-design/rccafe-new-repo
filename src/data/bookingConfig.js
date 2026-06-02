// Booking configuration and slot management
// This layer is designed to connect to a backend (Supabase, Firebase, Custom API)
// Currently uses localStorage for demo purposes

export const BOOKING_CONFIG = {
  // Operating days: Monday (1) to Friday (5)
  operatingDays: [1, 2, 3, 4, 5],
  
  // Operating hours: 9:00 AM to 4:00 PM
  operatingHours: {
    start: { hour: 9, minute: 0 },
    end: { hour: 16, minute: 0 }
  },
  
  // Session duration in minutes
  sessionDuration: 45,
  
  // Maximum bookings per slot
  maxCapacity: 5,
  
  // Slot start times (in minutes from midnight)
  slotStartTimes: [
    9 * 60,      // 09:00 AM
    9 * 60 + 45, // 09:45 AM
    10 * 60 + 30, // 10:30 AM
    11 * 60 + 15, // 11:15 AM
    12 * 60,      // 12:00 PM
    12 * 60 + 45, // 12:45 PM
    13 * 60 + 30, // 01:30 PM
    14 * 60 + 15, // 02:15 PM
    15 * 60       // 03:00 PM
  ]
}

/**
 * Generate available slots for a given date
 * @param {Date} date - The date to generate slots for
 * @returns {Array} Array of slot objects with availability info
 */
export function generateSlotsForDate(date) {
  const { operatingDays, slotStartTimes, maxCapacity } = BOOKING_CONFIG
  const dayOfWeek = date.getDay()
  
  // Check if date is an operating day
  if (!operatingDays.includes(dayOfWeek)) {
    return []
  }
  
  // Get existing bookings for this date (from localStorage for demo)
  const existingBookings = getBookingsForDate(date)
  
  return slotStartTimes.map((minutes, index) => {
    const time = formatTime(minutes)
    const bookingCount = existingBookings.filter(b => b.slotIndex === index).length
    const available = maxCapacity - bookingCount
    
    return {
      index,
      time,
      available,
      maxCapacity,
      status: getSlotStatus(available, maxCapacity)
    }
  })
}

/**
 * Get slot status based on availability
 * @param {number} available - Number of available spots
 * @param {number} maxCapacity - Maximum capacity
 * @returns {string} 'available' | 'almost-full' | 'full'
 */
function getSlotStatus(available, maxCapacity) {
  if (available === 0) return 'full'
  if (available <= 2) return 'almost-full'
  return 'available'
}

/**
 * Format minutes from midnight to HH:MM AM/PM
 * @param {number} minutes - Minutes from midnight
 * @returns {string} Formatted time string
 */
function formatTime(minutes) {
  const hours = Math.floor(minutes / 60)
  const mins = minutes % 60
  const period = hours >= 12 ? 'PM' : 'AM'
  const displayHours = hours > 12 ? hours - 12 : hours === 0 ? 12 : hours
  const displayMins = mins.toString().padStart(2, '0')
  return `${displayHours}:${displayMins} ${period}`
}

/**
 * Get bookings for a specific date from storage
 * @param {Date} date - The date to get bookings for
 * @returns {Array} Array of booking objects
 */
function getBookingsForDate(date) {
  const dateKey = formatDateKey(date)
  const stored = localStorage.getItem(`bookings_${dateKey}`)
  return stored ? JSON.parse(stored) : []
}

/**
 * Format date as YYYY-MM-DD for storage key
 * @param {Date} date - The date to format
 * @returns {string} Date string in YYYY-MM-DD format
 */
function formatDateKey(date) {
  const year = date.getFullYear()
  const month = (date.getMonth() + 1).toString().padStart(2, '0')
  const day = date.getDate().toString().padStart(2, '0')
  return `${year}-${month}-${day}`
}

/**
 * Save a booking to storage
 * @param {Object} booking - Booking object with all details
 * @returns {boolean} Success status
 */
export function saveBooking(booking) {
  try {
    const dateKey = formatDateKey(booking.date)
    const existingBookings = getBookingsForDate(booking.date)
    
    // Check if slot is still available
    const slotBookings = existingBookings.filter(b => b.slotIndex === booking.slotIndex)
    if (slotBookings.length >= BOOKING_CONFIG.maxCapacity) {
      return false
    }
    
    // Add new booking
    const newBooking = {
      ...booking,
      id: generateBookingId(),
      createdAt: new Date().toISOString()
    }
    
    existingBookings.push(newBooking)
    localStorage.setItem(`bookings_${dateKey}`, JSON.stringify(existingBookings))
    
    return true
  } catch (error) {
    console.error('Error saving booking:', error)
    return false
  }
}

/**
 * Generate a unique booking ID
 * @returns {string} Unique booking ID
 */
function generateBookingId() {
  return `BK${Date.now()}${Math.random().toString(36).substr(2, 9).toUpperCase()}`
}

/**
 * Check if a date is an operating day
 * @param {Date} date - The date to check
 * @returns {boolean} True if operating day
 */
export function isOperatingDay(date) {
  return BOOKING_CONFIG.operatingDays.includes(date.getDay())
}

/**
 * Get next available operating day
 * @param {Date} startDate - Date to start from
 * @returns {Date} Next operating day
 */
export function getNextOperatingDay(startDate = new Date()) {
  let date = new Date(startDate)
  date.setHours(0, 0, 0, 0)
  
  while (!isOperatingDay(date)) {
    date.setDate(date.getDate() + 1)
  }
  
  return date
}

/**
 * Get available dates for the next 30 days
 * @returns {Array} Array of available dates
 */
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

/**
 * Validate booking form data
 * @param {Object} data - Form data to validate
 * @returns {Object} Validation result with isValid and errors
 */
export function validateBookingData(data) {
  const errors = {}
  
  // Full name validation
  if (!data.name || data.name.trim().length < 2) {
    errors.name = 'Please enter your full name (min 2 characters)'
  }
  
  // Mobile number validation (NZ format: +64 or 0 followed by 9-10 digits)
  const phoneRegex = /^(\+64|0)[2-9]\d{7,9}$/
  if (!data.phone || !phoneRegex.test(data.phone.replace(/\s/g, ''))) {
    errors.phone = 'Please enter a valid NZ mobile number (e.g., 021 123 4567)'
  }
  
  // Email validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!data.email || !emailRegex.test(data.email)) {
    errors.email = 'Please enter a valid email address'
  }
  
  // Group size validation
  if (!data.groupSize || data.groupSize < 1 || data.groupSize > 20) {
    errors.groupSize = 'Group size must be between 1 and 20'
  }
  
  // Time slot validation
  if (data.slotIndex === null || data.slotIndex === undefined) {
    errors.slotIndex = 'Please select a time slot'
  }
  
  return {
    isValid: Object.keys(errors).length === 0,
    errors
  }
}

/**
 * Format date for display
 * @param {Date} date - Date to format
 * @returns {string} Formatted date string
 */
export function formatDateDisplay(date) {
  const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }
  return date.toLocaleDateString('en-NZ', options)
}

/**
 * Get slot time from index
 * @param {number} slotIndex - Slot index
 * @returns {string} Formatted time string
 */
export function getSlotTime(slotIndex) {
  const { slotStartTimes } = BOOKING_CONFIG
  if (slotIndex < 0 || slotIndex >= slotStartTimes.length) return ''
  return formatTime(slotStartTimes[slotIndex])
}
