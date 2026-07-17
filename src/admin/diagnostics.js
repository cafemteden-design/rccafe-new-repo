import { isSupabaseConfigured, supabase } from '../lib/supabaseClient.js'

/**
 * Read-only Supabase health checks for the admin Diagnostics page.
 *
 * IMPORTANT: Every probe here is non-mutating. We never call RPCs that create,
 * update, stamp, or redeem records, and we never delete storage objects. The
 * goal is to verify the backend is correctly installed and reachable under the
 * current authenticated role without changing any customer data.
 */

export const EXPECTED_TABLES = [
  'profiles',
  'reward_cards',
  'reward_events',
  'reward_offers',
  'reward_notifications',
  'reward_settings',
  'packages',
  'menu_items',
  'media_library',
  'website_sections',
  'seo_pages',
  'website_leads',
  'venue_hire_enquiries',
  'bookings_mirror',
  'customers',
  'activity_logs',
  'settings'
  ,'booking_settings'
  ,'booking_slot_capacity'
  ,'reward_notification_reads'
]

// RPCs that are safe to probe without mutating data.
// register/add_stamp/redeem are intentionally excluded (they write data).
const READONLY_RPCS = [
  {
    name: 'get_reward_card_by_token',
    args: { p_secure_token: '00000000-0000-0000-0000-000000000000' }
  },
  {
    name: 'login_reward_card',
    args: { p_rcc_card_id: '__diagnostic_probe__', p_date_of_birth: '1900-01-01' }
  },
  {
    name: 'login_reward_card_by_email',
    args: { p_email: 'diagnostic.invalid@example.com', p_date_of_birth: '1900-01-01' }
  },
  {
    name: 'check_reward_identity',
    args: { p_email: 'diagnostic.invalid@example.com', p_mobile: '0000000' }
  },
  {
    name: 'get_admin_dashboard_stats',
    args: {}
  },
  {
    name: 'get_slot_availability_v3',
    args: { p_booking_date: '2099-01-01', p_booking_time: '09:00 AM' }
  }
]

const MUTATING_RPCS = ['create_booking_request_v3', 'create_booking_request_v4', 'set_booking_status', 'cancel_confirmed_booking', 'create_reward_notification', 'register_reward_card', 'add_reward_stamp', 'undo_last_reward_stamp', 'redeem_reward', 'redeem_welcome_gift']

/**
 * Calls the read-only admin_access_diagnostics() RPC to report the caller's real
 * identity and role. This is what makes the Diagnostics page able to say exactly
 * why a module is blocked (wrong/inactive role) versus a missing SQL install.
 */
async function probeIdentity() {
  try {
    const { data, error } = await supabase.rpc('admin_access_diagnostics')
    if (error) {
      if (/does not exist|could not find/i.test(error.message)) {
        return { available: false, reason: 'admin_access_diagnostics() not installed. Run admin-final-access-fix.sql.' }
      }
      return { available: false, reason: error.message }
    }
    return { available: true, ...data }
  } catch (err) {
    return { available: false, reason: err.message }
  }
}

function ok(name, detail) {
  return { name, status: 'ok', detail }
}
function warn(name, detail) {
  return { name, status: 'warn', detail }
}
function fail(name, detail) {
  return { name, status: 'fail', detail }
}

async function probeTable(table) {
  try {
    const { count, error } = await supabase
      .from(table)
      .select('*', { count: 'exact', head: true })
    if (error) {
      // A permission error still proves the table exists; RLS is simply blocking reads.
      const isRls = /permission|rls|policy|not allowed/i.test(error.message)
      return isRls
        ? warn(table, `Reachable but blocked by RLS for this role (${error.message}).`)
        : fail(table, error.message)
    }
    return ok(table, `${count ?? 0} row${count === 1 ? '' : 's'} readable.`)
  } catch (err) {
    return fail(table, err.message)
  }
}

async function probeRpc({ name, args }) {
  try {
    const { error } = await supabase.rpc(name, args)
    if (error) {
      // "function does not exist" => missing. Anything else => function exists but rejected probe args.
      if (/does not exist|could not find/i.test(error.message)) return fail(name, 'Function not found in database.')
      return ok(name, 'Function exists (probe input safely rejected).')
    }
    return ok(name, 'Function exists and is callable.')
  } catch (err) {
    return fail(name, err.message)
  }
}

async function probeStorage(bucket = 'rcc-media') {
  try {
    const { error } = await supabase.storage.from(bucket).list('', { limit: 1 })
    if (error) {
      if (/not found|does not exist/i.test(error.message)) return fail(bucket, 'Storage bucket not found.')
      return warn(bucket, error.message)
    }
    return ok(bucket, 'Storage bucket reachable.')
  } catch (err) {
    return fail(bucket, err.message)
  }
}

async function probeAuth() {
  try {
    const { data, error } = await supabase.auth.getSession()
    if (error) return fail('auth.session', error.message)
    if (!data.session) return warn('auth.session', 'No active session.')
    return ok('auth.session', `Signed in as ${data.session.user.email}.`)
  } catch (err) {
    return fail('auth.session', err.message)
  }
}

/**
 * Runs the full read-only diagnostic suite and returns grouped results.
 */
export async function runDiagnostics() {
  if (!isSupabaseConfigured || !supabase) {
    return {
      configured: false,
      tables: [],
      rpcs: [],
      storage: [],
      auth: [],
      summary: { ok: 0, warn: 0, fail: 0 }
    }
  }

  const [tables, rpcs, storage, auth, identity] = await Promise.all([
    Promise.all(EXPECTED_TABLES.map(probeTable)),
    Promise.all(READONLY_RPCS.map(probeRpc)),
    Promise.all([probeStorage('rcc-media')]),
    Promise.all([probeAuth()]),
    probeIdentity()
  ])

  const all = [...tables, ...rpcs, ...storage, ...auth]
  const summary = {
    ok: all.filter((r) => r.status === 'ok').length,
    warn: all.filter((r) => r.status === 'warn').length,
    fail: all.filter((r) => r.status === 'fail').length
  }

  return { configured: true, identity, tables, rpcs, storage, auth, summary, mutatingRpcs: MUTATING_RPCS }
}
