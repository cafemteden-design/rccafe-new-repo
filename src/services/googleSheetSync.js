import { BOOKING_API_URL } from '../data/bookingConfig.js'

const GOOGLE_SCRIPT_URL = BOOKING_API_URL

export function isGoogleSheetSyncConfigured() {
  return /^https:\/\/script\.google\.com\/macros\/s\/.+\/exec$/i.test(GOOGLE_SCRIPT_URL)
}

export async function syncGoogleSheet(action, payload) {
  if (!isGoogleSheetSyncConfigured()) {
    if (import.meta.env.DEV) {
      console.warn('Google Sheet sync skipped: Apps Script URL not configured.')
    }
    return { success: false, skipped: true, warning: true, message: 'Google Sheet sync skipped: Apps Script URL not configured.' }
  }

  const controller = new AbortController()
  const timeout = window.setTimeout(() => controller.abort(), 30000)
  try {
    const response = await fetch(GOOGLE_SCRIPT_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify({ action, ...payload }),
      signal: controller.signal
    })
    const text = await response.text()
    let body = {}
    try { body = text ? JSON.parse(text) : {} } catch { body = { message: text } }
    if (!response.ok || body.success === false) {
      return { success: false, warning: true, message: body.message || `Sheet sync failed (${response.status}).` }
    }
    return { success: true, data: body }
  } catch (error) {
    return { success: false, warning: true, message: error.name === 'AbortError' ? 'Google Sheet sync timed out.' : error.message || 'Google Sheet sync is temporarily unavailable.' }
  } finally {
    window.clearTimeout(timeout)
  }
}

export function bookingToSheetPayload(booking) {
  const selections = normalizeFoodSelections(booking)
  const foodSummary = selections.map((item, index) => `Remote ${index + 1}: ${item.toastie} + ${item.coffee}`).join('\n')
  return {
    booking_id: booking.booking_id,
    supabase_booking_id: booking.id,
    customer_name: booking.customer_name,
    phone: booking.customer_phone,
    email: booking.customer_email,
    booking_date: booking.booking_date,
    slot_start: booking.booking_time,
    slot_end: booking.slot_end,
    slot_label: booking.slot_label || booking.booking_time,
    remote_spots: booking.group_size,
    gameplay_duration: booking.gameplay_duration || booking.package_duration,
    price_per_remote: booking.price_per_remote,
    total_price: booking.total_price || booking.package_price,
    toastie_selection: booking.toastie_selection,
    drink_selection: booking.drink_selection,
    cancellation_reason: booking.cancellation_reason,
    business_hours_snapshot: booking.business_hours_snapshot || {},
    per_remote_selections: selections,
    per_remote_selections_json: JSON.stringify(selections),
    food_items: booking.food_items || selections,
    food_summary: foodSummary,
    notes: booking.notes,
    status: booking.status,
    payment_status: booking.payment_status,
    booking_source: booking.source,
    admin_notes: booking.admin_notes,
    cancelled_at: booking.cancelled_at,
    cancelled_by: booking.cancelled_by,
    last_updated: booking.updated_at
  }
}

function normalizeFoodSelections(booking) {
  const value = booking.per_remote_selections || booking.perRemoteSelections || booking.food_items
  let rows = value
  if (typeof rows === 'string') {
    try { rows = JSON.parse(rows) } catch { rows = [] }
  }
  if (Array.isArray(rows) && rows.length) {
    return rows.map((item, index) => ({ remote: Number(item.remote || index + 1), toastie: item.toastie || '', coffee: item.coffee || item.drink || '' }))
  }
  if (booking.toastie_selection || booking.drink_selection) {
    return [{ remote: 1, toastie: booking.toastie_selection || '', coffee: booking.drink_selection || '' }]
  }
  return []
}

export function rewardToSheetPayload(card, extra = {}) {
  return {
    reward_card_id: card.id,
    card_number: card.rcc_card_id,
    card_token: card.secure_token,
    customer_name: card.full_name,
    email_address: card.email,
    mobile_number: card.mobile,
    card_status: card.reward_status,
    current_cycle: card.cycle_number,
    current_stamps: card.current_stamps,
    lifetime_stamps: card.lifetime_stamps ?? card.total_stamps,
    total_rewards_redeemed: card.rewards_redeemed ?? Math.max(Number(card.cycle_number || 1) - 1, 0),
    welcome_gift_status: card.welcome_gift_redeemed ? 'Redeemed' : card.welcome_gift_unlocked ? 'Available' : 'Locked',
    notification_enabled: card.notification_enabled !== false,
    last_updated: card.updated_at,
    ...extra
  }
}
