export const DAY_KEYS = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday']

export const OFFICIAL_BUSINESS_HOURS = {
  monday: { open: '09:00', close: '16:00' },
  tuesday: { open: '09:00', close: '16:00' },
  wednesday: { open: '09:00', close: '17:00' },
  thursday: { open: '09:00', close: '17:00' },
  friday: { open: '09:00', close: '17:00' },
  saturday: { open: '08:00', close: '17:00' },
  sunday: { open: '08:00', close: '16:00' }
}

export const BUSINESS_HOURS_ROWS = [
  ['monday', 'Monday'],
  ['tuesday', 'Tuesday'],
  ['wednesday', 'Wednesday'],
  ['thursday', 'Thursday'],
  ['friday', 'Friday'],
  ['saturday', 'Saturday'],
  ['sunday', 'Sunday']
]

export function mergeBusinessHours(value = {}) {
  return Object.fromEntries(BUSINESS_HOURS_ROWS.map(([key]) => [key, {
    ...OFFICIAL_BUSINESS_HOURS[key],
    ...(value?.[key] || {})
  }]))
}

export function hoursForDate(date, businessHours = OFFICIAL_BUSINESS_HOURS) {
  const key = DAY_KEYS[date?.getDay?.()]
  return key ? mergeBusinessHours(businessHours)[key] : null
}

export function generateHourlySlots(date, businessHours = OFFICIAL_BUSINESS_HOURS) {
  const hours = hoursForDate(date, businessHours)
  if (!hours) return []
  const start = timeToMinutes(hours.open)
  const end = timeToMinutes(hours.close)
  if (!Number.isFinite(start) || !Number.isFinite(end) || end <= start) return []

  return Array.from({ length: Math.floor((end - start) / 60) }, (_, index) => {
    const slotStart = start + index * 60
    const slotEnd = slotStart + 60
    const startTime = formatMinutes(slotStart)
    const endTime = formatMinutes(slotEnd)
    return { index, startTime, endTime, label: `${startTime} - ${endTime}` }
  })
}

export function businessHoursSnapshot(date, businessHours = OFFICIAL_BUSINESS_HOURS) {
  const hours = hoursForDate(date, businessHours)
  const dayKey = DAY_KEYS[date?.getDay?.()]
  return {
    day: dayKey ? `${dayKey[0].toUpperCase()}${dayKey.slice(1)}` : '',
    open: hours?.open || '',
    close: hours?.close || '',
    timezone: 'Pacific/Auckland'
  }
}

export function formatBusinessHours(hours) {
  return hours ? `${formatClock(hours.open)} - ${formatClock(hours.close)}` : 'Closed'
}

export function formatClock(value) {
  const minutes = timeToMinutes(value)
  if (!Number.isFinite(minutes)) return String(value || '')
  return formatMinutes(minutes)
}

function timeToMinutes(value) {
  const match = String(value || '').match(/^(\d{1,2}):(\d{2})/)
  if (!match) return Number.NaN
  return Number(match[1]) * 60 + Number(match[2])
}

function formatMinutes(totalMinutes) {
  const hour24 = Math.floor(totalMinutes / 60) % 24
  const minute = totalMinutes % 60
  const period = hour24 >= 12 ? 'PM' : 'AM'
  const hour = hour24 % 12 || 12
  return `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')} ${period}`
}
