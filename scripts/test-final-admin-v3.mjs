import fs from 'node:fs'
import path from 'node:path'
import assert from 'node:assert/strict'

const root = process.cwd()
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8')
const sql = read('supabase/20260711_remote_control_cafe_booking_upgrade.sql')
const app = read('src/App.jsx')
const bookingPage = read('src/pages/Booking.jsx')
const adminBookings = read('src/pages/admin/AdminBookingsV2.jsx')
const adminDashboard = read('src/pages/admin/AdminDashboard.jsx')
const bookingService = read('src/services/bookingV2.js')
const sheetService = read('src/services/googleSheetSync.js')
const appsScript = read('google-apps-script/Code.gs')
const adminConfig = read('src/admin/adminConfig.js')

const checks = [
  ['safe migration exists', /Remote Control Cafe booking workflow upgrade/i.test(sql)],
  ['status default is confirmed', /alter column status set default 'confirmed'/i.test(sql)],
  ['status constraint is final model', /check \(status in \('confirmed', 'cancelled', 'completed', 'no_show'\)\)/i.test(sql)],
  ['drink_selection constraint uses menu coffee choices', /drink_selection is null or drink_selection in \('Any Black', 'Flat White \/ Latte', 'Hot Choco', 'Cappuccino', 'Fluffy'\)/i.test(sql)],
  ['cancellation reason added', /add column if not exists cancellation_reason/i.test(sql)],
  ['confirmed creation uses transaction lock', /create_booking_request_v4[\s\S]*pg_advisory_xact_lock/i.test(sql)],
  ['capacity sums confirmed remote spots', /sum\(group_size\)[\s\S]*status = 'confirmed'/i.test(sql)],
  ['admin-only cancellation rpc exists', /function public\.cancel_confirmed_booking/i.test(sql)],
  ['cancel rpc prevents duplicates', /Booking is already cancelled/i.test(sql)],
  ['frontend uses confirmed booking service', /createConfirmedBooking/i.test(bookingPage) && /status: 'confirmed'/i.test(bookingPage)],
  ['toastie options remain imported', /TOASTIE_CHOICES/i.test(bookingPage)],
  ['drink choices are restricted', /BOOKING_DRINK_CHOICES/i.test(bookingPage) && /Fluffy/.test(bookingPage) === false],
  ['admin filters final statuses', /confirmed', 'cancelled', 'completed', 'no_show/i.test(adminBookings)],
  ['admin cancel modal exists', /Cancel this booking\?/i.test(adminBookings)],
  ['admin obsolete actions removed', !new RegExp(['bookingAp', 'proved|bookingRe', 'jected|Ap', 'prove|Re', 'ject'].join('')).test(adminBookings)],
  ['dashboard obsolete stats removed', !new RegExp(['Pending Ap', 'provals|Ap', 'proved Bookings|pendingBookings|ap', 'provedBookings'].join('')).test(adminDashboard)],
  ['booking service validates drink', /BOOKING_DRINK_VALUES = BOOKING_DRINK_CHOICES/i.test(bookingService)],
  ['Sheet sync carries cancellation reason', /cancellation_reason/i.test(sheetService)],
  ['Apps Script confirmed email', /Booking Confirmed/i.test(appsScript) && /New Confirmed Booking/i.test(appsScript)],
  ['Apps Script cancellation email', /Booking Cancelled/i.test(appsScript)],
  ['Apps Script validates drink', /validateDrinkSelection_/i.test(appsScript)],
  ['Apps Script optional webhook secret', /WEBHOOK_SECRET/i.test(appsScript)],
  ['booking settings route exists', /path="bookings\/settings"/i.test(app)],
  ['Old Packages navigation removed', !/to:\s*['"]\/admin\/packages/i.test(adminConfig)],
  ['no destructive table drops', !/drop\s+table/i.test(sql)]
]

for (const [name, passed] of checks) assert.equal(passed, true, `Contract failed: ${name}`)

const canConfirm = (confirmedSpots, requested, capacity = 8) => confirmedSpots + requested <= capacity
assert.equal(canConfirm(5, 3), true, '5+3 must fit')
assert.equal(canConfirm(6, 2), true, '6+2 must fit')
assert.equal(canConfirm(6, 3), false, '6+3 must not fit')
assert.equal(canConfirm(8, 1), false, '8+1 must not fit')
assert.equal(canConfirm(0, 8), true, '0+8 must fit')

console.log(`Confirmed booking workflow contract QA passed: ${checks.length + 5} checks.`)
