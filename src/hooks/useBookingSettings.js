import { useCallback, useEffect, useState } from 'react'
import { BOOKING_CONFIG } from '../data/bookingConfig.js'
import { OFFICIAL_BUSINESS_HOURS, mergeBusinessHours } from '../data/businessHours.js'
import { supabase } from '../lib/supabaseClient.js'

export const DEFAULT_BOOKING_SETTINGS = {
  ...BOOKING_CONFIG,
  maximumGroupSize: 8,
  slotCount: 8,
  slotDuration: 60,
  holidayDates: [],
  blackoutDates: [],
  onlineBookingEnabled: true,
  gameplayPrices: { 45: 45, 60: 55 },
  businessHours: OFFICIAL_BUSINESS_HOURS,
  largeGroupMessage: 'Need more than 8 remotes? Please contact us at cafemteden@gmail.com.',
  gameplayExtensionMessage: 'Extra gameplay is available in-store only.',
  noticeText: 'Online bookings are available every day. Each time slot has a maximum of 8 remote spots. One person uses one remote spot. If a time slot is full, it will be marked as fully booked.'
}

export function useBookingSettings() {
  const [settings, setSettings] = useState(DEFAULT_BOOKING_SETTINGS)
  const [loading, setLoading] = useState(Boolean(supabase))
  const [error, setError] = useState('')

  const load = useCallback(async () => {
    if (!supabase) {
      setSettings(DEFAULT_BOOKING_SETTINGS)
      setLoading(false)
      return
    }
    setLoading(true)
    setError('')
    const timeout = new Promise((resolve) => window.setTimeout(() => resolve({ error: new Error('Booking settings request timed out.') }), 8000))
    const query = supabase.from('booking_settings').select('*').eq('id', 1).maybeSingle()
    const { data, error: queryError } = await Promise.race([query, timeout])
    if (queryError) {
      setSettings(DEFAULT_BOOKING_SETTINGS)
      setError('Live booking settings are temporarily unavailable. Safe defaults are being used.')
    } else if (data) {
      setSettings(mapSettings(data))
    }
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])
  return { settings, loading, error, retry: load }
}

function mapSettings(row) {
  const operatingDays = []
  if (row.weekend_enabled !== false && row.sunday_enabled) operatingDays.push(0)
  if (row.monday_enabled) operatingDays.push(1)
  if (row.tuesday_enabled) operatingDays.push(2)
  if (row.wednesday_enabled) operatingDays.push(3)
  if (row.thursday_enabled) operatingDays.push(4)
  if (row.friday_enabled) operatingDays.push(5)
  if (row.weekend_enabled !== false && row.saturday_enabled) operatingDays.push(6)
  const hours = row.operating_hours || {}
  return {
    onlineBookingEnabled: row.online_booking_enabled !== false,
    operatingDays,
    operatingHours: {
      start: parseTime(hours.start || row.opening_time, BOOKING_CONFIG.operatingHours.start),
      end: parseTime(hours.end || row.closing_time, BOOKING_CONFIG.operatingHours.end)
    },
    businessHours: mergeBusinessHours(row.business_hours),
    maxCapacity: positiveNumber(row.capacity_per_slot ?? row.slot_capacity, 8),
    maximumGroupSize: positiveNumber(row.max_group_size ?? row.maximum_group_size, 8),
    slotCount: positiveNumber(row.slot_count, 8),
    slotDuration: positiveNumber(row.slot_duration, 60),
    defaultSlotDuration: positiveNumber(row.slot_duration ?? row.slot_interval_minutes, 60),
    holidayDates: row.holiday_dates || [],
    blackoutDates: row.blackout_dates || [],
    gameplayPrices: { ...DEFAULT_BOOKING_SETTINGS.gameplayPrices, ...(row.gameplay_prices || {}) },
    largeGroupMessage: row.large_group_message || DEFAULT_BOOKING_SETTINGS.largeGroupMessage,
    gameplayExtensionMessage: row.gameplay_extension_message || DEFAULT_BOOKING_SETTINGS.gameplayExtensionMessage,
    noticeText: row.notice_text || DEFAULT_BOOKING_SETTINGS.noticeText
  }
}

function parseTime(value, fallback) {
  const match = String(value || '').match(/^(\d{1,2}):(\d{2})/)
  return match ? { hour: Number(match[1]), minute: Number(match[2]) } : fallback
}

function positiveNumber(value, fallback) {
  const number = Number(value)
  return Number.isFinite(number) && number > 0 ? number : fallback
}
