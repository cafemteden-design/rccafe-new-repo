import { supabase } from '../lib/supabaseClient.js'
import { BOOKING_DRINK_CHOICES } from '../data/menu.js'

export const BOOKING_STATUSES = ['pending', 'confirmed', 'approved', 'cancelled', 'completed', 'no_show']

export function isConfirmedStatus(status) {
  return status === 'confirmed' || status === 'approved'
}
export const BOOKING_DRINK_VALUES = BOOKING_DRINK_CHOICES

export async function createPendingBooking(booking) {
  if (!supabase) throw new Error('Live booking service is not configured.')
  const duration = Number(booking.packageDuration || booking.baseDuration || booking.durationMinutes)
  const drinkSelection = booking.drinkSelection || booking.coffeeChoice || null
  if (!BOOKING_DRINK_VALUES.includes(drinkSelection)) throw new Error('Please select a valid coffee option.')
  const baseArgs = {
    p_customer_name: booking.customerName || booking.name,
    p_customer_email: booking.customerEmail || booking.email,
    p_customer_phone: booking.customerPhone || booking.phone,
    p_booking_date: booking.bookingDate || booking.date,
    p_booking_time: booking.bookingTime || booking.slotTime,
    p_gameplay_duration: duration,
    p_price_per_remote: Number(booking.pricePerRemote || booking.packagePrice),
    p_remote_spots: Number(booking.groupSize || booking.players),
    p_toastie_selection: booking.toastieSelection || booking.toastieChoice || null,
    p_drink_selection: drinkSelection,
    p_notes: booking.notes || null,
    p_source: booking.source || 'website'
  }
  const { data, error } = await supabase.rpc('create_booking_request_v4', {
    ...baseArgs,
    p_business_hours_snapshot: booking.businessHoursSnapshot || booking.business_hours_snapshot || {},
    p_per_remote_selections: booking.perRemoteSelections || booking.per_remote_selections || []
  })
  if (error && isMissingRpc(error, 'create_booking_request_v4')) {
    const fallback = await supabase.rpc('create_booking_request_v3', baseArgs)
    if (fallback.error) throw fallback.error
    return fallback.data
  }
  if (error) throw error
  return data
}

export const createConfirmedBooking = createPendingBooking

export async function approveBooking(bookingId) {
  if (!supabase) throw new Error('Live booking service is not configured.')
  const { data, error } = await supabase.rpc('set_booking_status', {
    p_booking_id: bookingId,
    p_status: 'confirmed'
  })
  if (error) throw error
  return data
}

export async function rejectBooking(bookingId, reason = '', note = '') {
  if (!supabase) throw new Error('Live booking service is not configured.')
  const { data, error } = await supabase.rpc('reject_booking', {
    p_booking_id: bookingId,
    p_rejection_reason: reason || null,
    p_admin_note: note || null
  })
  if (error) throw error
  return data
}

export async function updateBookingStatus(bookingId, status, note = '') {
  if (!supabase) throw new Error('Live booking service is not configured.')
  const normalized = String(status || '').trim().toLowerCase()
  if (!BOOKING_STATUSES.includes(normalized)) throw new Error('Unsupported booking status.')
  const { data, error } = await supabase.rpc('set_booking_status', {
    p_booking_id: bookingId,
    p_status: normalized,
    p_admin_note: note || null
  })
  if (error) throw error
  return data
}

export async function cancelBooking(bookingId, reason = '') {
  if (!supabase) throw new Error('Live booking service is not configured.')
  const { data, error } = await supabase.rpc('cancel_confirmed_booking', {
    p_booking_id: bookingId,
    p_cancellation_reason: reason || null
  })
  if (error) throw error
  return data
}

export async function markConfirmationEmailSent(bookingId) {
  if (!supabase) return false
  const { data, error } = await supabase.rpc('mark_confirmation_email_sent', { p_booking_id: bookingId })
  if (error) throw error
  return data
}

export async function markRejectionEmailSent(bookingId) {
  if (!supabase) return false
  const { data, error } = await supabase.rpc('mark_rejection_email_sent', { p_booking_id: bookingId })
  if (error) throw error
  return data
}

export async function fetchDateAvailability(dateKey) {
  if (!supabase) return null
  const { data, error } = await supabase.rpc('get_date_availability', { p_date: dateKey })
  if (error) throw error
  return data
}

export async function fetchConfirmedSlotUsage(dateKey) {
  if (!supabase) return []
  const { data, error } = await supabase
    .from('booking_slot_capacity')
    .select('slot_time,approved_spots,updated_at')
    .eq('booking_date', dateKey)
  if (error) throw error
  return data || []
}

export function slotUsageToAvailability(rows, capacity) {
  return (rows || []).map((row) => {
    const usedSpots = Math.max(Number(row.approved_spots || 0), 0)
    const remainingSpots = Math.max(Number(capacity) - usedSpots, 0)
    return {
      slot: row.slot_time,
      usedSpots,
      remainingSpots,
      available: remainingSpots,
      status: remainingSpots <= 0 ? 'FULLY BOOKED' : 'AVAILABLE'
    }
  })
}

export function subscribeToSlotCapacity(dateKey, onChange) {
  if (!supabase || !dateKey) return () => {}
  const channel = supabase
    .channel(`booking-capacity-${dateKey}`)
    .on('postgres_changes', {
      event: '*',
      schema: 'public',
      table: 'booking_slot_capacity',
      filter: `booking_date=eq.${dateKey}`
    }, onChange)
    .subscribe()
  return () => { supabase.removeChannel(channel) }
}

function isMissingRpc(error, functionName) {
  const message = `${error?.code || ''} ${error?.message || ''} ${error?.details || ''}`.toLowerCase()
  return message.includes('pgrst202') || (message.includes(functionName.toLowerCase()) && message.includes('schema cache'))
}
