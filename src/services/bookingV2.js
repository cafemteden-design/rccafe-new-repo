import { supabase } from '../lib/supabaseClient.js'

export async function createPendingBooking(booking) {
  if (!supabase) throw new Error('Live booking service is not configured.')
  const duration = Number(booking.packageDuration || booking.baseDuration || booking.durationMinutes)
  // Existing RPC validates the legacy internal names. Customer-facing V3 never displays them.
  const backendPackageName = duration === 45 ? 'POWER' : duration === 60 ? 'MASTER' : booking.packageName
  const { data, error } = await supabase.rpc('create_booking_request', {
    p_customer_name: booking.customerName || booking.name,
    p_customer_email: booking.customerEmail || booking.email,
    p_customer_phone: booking.customerPhone || booking.phone,
    p_booking_date: booking.bookingDate || booking.date,
    p_booking_time: booking.bookingTime || booking.slotTime,
    p_package_name: backendPackageName,
    p_package_duration: duration,
    p_package_price: Number(booking.packagePrice || booking.totalPrice),
    p_group_size: Number(booking.groupSize || booking.players),
    p_toastie_selection: booking.toastieSelection || booking.toastieChoice || null,
    p_drink_selection: booking.drinkSelection || booking.coffeeChoice || null,
    p_notes: booking.notes || null,
    p_source: booking.source || 'website'
  })
  if (error) throw error
  return data
}

export async function fetchApprovedSlotUsage(dateKey) {
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
