/**
 * RCC Cafe booking API.
 * Deploy as a Google Apps Script Web App: execute as owner, access Anyone.
 * Script properties (optional): BOOKINGS_SHEET_NAME, ADMIN_EMAILS,
 * SUPABASE_URL, SUPABASE_ANON_KEY.
 */

var RCC_DEFAULTS = {
  sheetName: 'Bookings',
  capacity: 8,
  timezone: 'Pacific/Auckland',
  adminEmails: 'cafemteden@gmail.com,mtedencafestaff@gmail.com'
};

var RCC_HEADERS = {
  bookingId: ['Booking ID', 'bookingId', 'booking_id'],
  name: ['Name', 'Full Name', 'Customer Name', 'customerName'],
  phone: ['Phone', 'Mobile', 'Mobile Number', 'Customer Phone', 'customerPhone'],
  email: ['Email', 'Email Address', 'Customer Email', 'customerEmail'],
  date: ['Date', 'Booking Date', 'bookingDate'],
  slot: ['Slot Time', 'Time', 'Booking Time', 'bookingTime', 'slotTime'],
  packageName: ['Package', 'Package Name', 'packageName'],
  packageDuration: ['Package Duration', 'Duration', 'packageDuration'],
  packagePrice: ['Package Price', 'Price', 'packagePrice'],
  groupSize: ['Group Size', 'Players', 'Remote Spots', 'groupSize', 'group_size'],
  toastie: ['Toastie Selection', 'Toastie', 'toastieSelection'],
  drink: ['Drink Selection', 'Drink', 'Coffee Selection', 'drinkSelection'],
  notes: ['Notes', 'Special Request', 'notes'],
  status: ['Status', 'Booking Status', 'bookingStatus'],
  source: ['Source', 'source'],
  createdAt: ['Created At', 'Timestamp', 'createdAt']
};

function doGet(e) {
  try {
    var params = (e && e.parameter) || {};
    var action = String(params.action || 'availability').toLowerCase();
    if (action === 'health') {
      return json_({ success: true, service: 'rcc-booking-api', capacity: getBookingSettings_().capacity });
    }
    if (action !== 'availability') {
      return json_({ success: false, message: 'Unsupported action.' });
    }
    return json_(getAvailability_(params.date || params.bookingDate, params.slot || params.slotTime));
  } catch (error) {
    console.error(error);
    return json_({ success: false, message: safeError_(error) });
  }
}

function doPost(e) {
  var lock = LockService.getScriptLock();
  try {
    lock.waitLock(30000);
    var payload = parseBody_(e);
    var action = String(payload.action || 'createBooking').toLowerCase();
    if (action !== 'createbooking') {
      return json_({ success: false, status: 'validation_error', message: 'Unsupported action.' });
    }
    return json_(createBooking_(payload));
  } catch (error) {
    console.error(error);
    return json_({ success: false, status: 'error', message: safeError_(error) });
  } finally {
    if (lock.hasLock()) lock.releaseLock();
  }
}

function createBooking_(raw) {
  var booking = normalizeBooking_(raw);
  validateBooking_(booking);

  var settings = getBookingSettings_();
  if (booking.groupSize > settings.maximumGroupSize) {
    return { success: false, status: 'validation_error', message: 'Maximum group size is ' + settings.maximumGroupSize + '.' };
  }

  var sheet = getBookingsSheet_();
  var headerMap = ensureHeaders_(sheet);
  var bookingId = booking.bookingId || nextBookingId_(sheet, headerMap);
  var row = new Array(sheet.getLastColumn()).fill('');
  setRowValue_(row, headerMap, 'bookingId', bookingId);
  setRowValue_(row, headerMap, 'name', booking.name);
  setRowValue_(row, headerMap, 'phone', booking.phone);
  setRowValue_(row, headerMap, 'email', booking.email);
  setRowValue_(row, headerMap, 'date', booking.date);
  setRowValue_(row, headerMap, 'slot', booking.slotTime);
  setRowValue_(row, headerMap, 'packageName', booking.packageName);
  setRowValue_(row, headerMap, 'packageDuration', booking.packageDuration);
  setRowValue_(row, headerMap, 'packagePrice', booking.packagePrice);
  setRowValue_(row, headerMap, 'groupSize', booking.groupSize);
  setRowValue_(row, headerMap, 'toastie', booking.toastieSelection);
  setRowValue_(row, headerMap, 'drink', booking.drinkSelection);
  setRowValue_(row, headerMap, 'notes', booking.notes);
  setRowValue_(row, headerMap, 'status', 'Pending Confirmation');
  setRowValue_(row, headerMap, 'source', booking.source);
  setRowValue_(row, headerMap, 'createdAt', new Date());
  sheet.appendRow(row);
  SpreadsheetApp.flush();

  sendBookingEmails_(booking, bookingId);
  return {
    success: true,
    status: 'success',
    bookingId: bookingId,
    bookingStatus: 'Pending Confirmation'
  };
}

function getAvailability_(dateValue, slotValue) {
  var date = normalizeDate_(dateValue);
  if (!date) return { success: false, message: 'Date parameter required.' };

  var settings = getBookingSettings_();
  var sheet = getBookingsSheet_();
  var headerMap = ensureHeaders_(sheet);
  var rows = sheet.getLastRow() > 1
    ? sheet.getRange(2, 1, sheet.getLastRow() - 1, sheet.getLastColumn()).getValues()
    : [];
  var usage = {};

  rows.forEach(function (row) {
    var rowDate = normalizeDate_(getRowValue_(row, headerMap, 'date'));
    var rowSlot = normalizeSlot_(getRowValue_(row, headerMap, 'slot'));
    var status = String(getRowValue_(row, headerMap, 'status') || '').trim().toLowerCase();
    if (rowDate !== date || !rowSlot || status !== 'approved') return;
    var spots = Number(getRowValue_(row, headerMap, 'groupSize'));
    usage[rowSlot] = (usage[rowSlot] || 0) + (isFinite(spots) && spots > 0 ? spots : 1);
  });

  if (slotValue) {
    return availabilityResult_(date, normalizeSlot_(slotValue), usage, settings.capacity);
  }

  return {
    success: true,
    date: date,
    capacity: settings.capacity,
    slots: Object.keys(usage).map(function (slot) {
      return availabilityResult_(date, slot, usage, settings.capacity);
    })
  };
}

function availabilityResult_(date, slot, usage, capacity) {
  var used = Math.max(Number(usage[slot] || 0), 0);
  var remaining = Math.max(capacity - used, 0);
  return {
    success: true,
    date: date,
    slot: slot,
    capacity: capacity,
    usedSpots: used,
    remainingSpots: remaining,
    available: remaining,
    fullyBooked: remaining <= 0,
    status: remaining <= 0 ? 'FULLY BOOKED' : 'AVAILABLE'
  };
}

function normalizeBooking_(raw) {
  return {
    bookingId: clean_(raw.bookingId || raw.booking_id),
    name: clean_(raw.customerName || raw.name),
    phone: clean_(raw.customerPhone || raw.phone || raw.mobile),
    email: clean_(raw.customerEmail || raw.email).toLowerCase(),
    date: normalizeDate_(raw.bookingDate || raw.date),
    slotTime: normalizeSlot_(raw.bookingTime || raw.slotTime || raw.slot || raw.time),
    packageName: clean_(raw.packageName || raw.package),
    packageDuration: clean_(raw.packageDuration || raw.baseDuration || raw.playTime),
    packagePrice: Number(raw.packagePrice || raw.totalPrice || raw.price || 0),
    groupSize: Number(raw.groupSize || raw.group_size || raw.players || raw.remoteSpots || 0),
    toastieSelection: clean_(raw.toastieSelection || raw.toastieChoice),
    drinkSelection: clean_(raw.drinkSelection || raw.coffeeChoice),
    notes: clean_(raw.notes),
    source: clean_(raw.source || 'website')
  };
}

function validateBooking_(booking) {
  if (!booking.name) throw new Error('Name is required.');
  if (!booking.phone) throw new Error('Phone is required.');
  if (!booking.email || booking.email.indexOf('@') < 1) throw new Error('Valid email is required.');
  if (!booking.date) throw new Error('Booking date is required.');
  if (!booking.slotTime) throw new Error('Booking time is required.');
  if (!booking.packageName || booking.packageName.toUpperCase() === 'MINI') throw new Error('Please select an available package.');
  if (!isFinite(booking.groupSize) || booking.groupSize < 1) throw new Error('Group size is required.');
}

function getBookingSettings_() {
  var defaults = {
    capacity: RCC_DEFAULTS.capacity,
    maximumGroupSize: RCC_DEFAULTS.capacity,
    operatingDays: [0, 1, 2, 3, 4, 5, 6],
    startTime: '09:00',
    endTime: '17:00',
    slotInterval: 60
  };
  var properties = PropertiesService.getScriptProperties();
  var url = properties.getProperty('SUPABASE_URL');
  var key = properties.getProperty('SUPABASE_ANON_KEY');
  if (!url || !key) return defaults;

  try {
    var response = UrlFetchApp.fetch(url.replace(/\/$/, '') + '/rest/v1/booking_settings?id=eq.1&select=*', {
      method: 'get',
      headers: { apikey: key, Authorization: 'Bearer ' + key },
      muteHttpExceptions: true
    });
    if (response.getResponseCode() !== 200) return defaults;
    var rows = JSON.parse(response.getContentText());
    if (!rows.length) return defaults;
    var row = rows[0];
    return {
      capacity: positiveInt_(row.slot_capacity, defaults.capacity),
      maximumGroupSize: positiveInt_(row.maximum_group_size, defaults.maximumGroupSize),
      operatingDays: row.operating_days || defaults.operatingDays,
      startTime: row.opening_time || defaults.startTime,
      endTime: row.closing_time || defaults.endTime,
      slotInterval: positiveInt_(row.slot_interval_minutes, defaults.slotInterval)
    };
  } catch (error) {
    console.warn('Supabase booking settings unavailable: ' + safeError_(error));
    return defaults;
  }
}

function getBookingsSheet_() {
  var spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  var name = PropertiesService.getScriptProperties().getProperty('BOOKINGS_SHEET_NAME') || RCC_DEFAULTS.sheetName;
  var sheet = spreadsheet.getSheetByName(name);
  if (!sheet) sheet = spreadsheet.insertSheet(name);
  return sheet;
}

function ensureHeaders_(sheet) {
  if (sheet.getLastRow() === 0) sheet.appendRow(Object.keys(RCC_HEADERS).map(function (key) { return RCC_HEADERS[key][0]; }));
  var headers = sheet.getRange(1, 1, 1, Math.max(sheet.getLastColumn(), 1)).getDisplayValues()[0];
  Object.keys(RCC_HEADERS).forEach(function (key) {
    if (findHeaderIndex_(headers, RCC_HEADERS[key]) < 0) {
      headers.push(RCC_HEADERS[key][0]);
      sheet.getRange(1, headers.length).setValue(RCC_HEADERS[key][0]);
    }
  });
  var map = {};
  Object.keys(RCC_HEADERS).forEach(function (key) { map[key] = findHeaderIndex_(headers, RCC_HEADERS[key]); });
  return map;
}

function findHeaderIndex_(headers, aliases) {
  var normalized = headers.map(function (value) { return String(value).trim().toLowerCase().replace(/[^a-z0-9]/g, ''); });
  for (var i = 0; i < aliases.length; i += 1) {
    var index = normalized.indexOf(String(aliases[i]).trim().toLowerCase().replace(/[^a-z0-9]/g, ''));
    if (index >= 0) return index;
  }
  return -1;
}

function getRowValue_(row, map, key) { return map[key] >= 0 ? row[map[key]] : ''; }
function setRowValue_(row, map, key, value) { if (map[key] >= 0) row[map[key]] = value; }

function nextBookingId_(sheet, map) {
  var values = sheet.getLastRow() > 1 && map.bookingId >= 0
    ? sheet.getRange(2, map.bookingId + 1, sheet.getLastRow() - 1, 1).getDisplayValues().flat()
    : [];
  var max = values.reduce(function (current, value) {
    var match = String(value).match(/RCC-(\d+)/i);
    return match ? Math.max(current, Number(match[1])) : current;
  }, 0);
  return 'RCC-' + String(max + 1).padStart(4, '0');
}

function sendBookingEmails_(booking, bookingId) {
  var properties = PropertiesService.getScriptProperties();
  var admins = properties.getProperty('ADMIN_EMAILS') || RCC_DEFAULTS.adminEmails;
  var subject = 'New RCC booking request - ' + bookingId;
  var body = [
    'NEW RCC BOOKING REQUEST', '',
    'Booking ID: ' + bookingId,
    'Name: ' + booking.name,
    'Phone: ' + booking.phone,
    'Email: ' + booking.email,
    'Date: ' + booking.date,
    'Time: ' + booking.slotTime,
    'Package: ' + booking.packageName,
    'Duration: ' + booking.packageDuration,
    'Remote spots: ' + booking.groupSize,
    'Toastie: ' + booking.toastieSelection,
    'Drink: ' + booking.drinkSelection,
    'Notes: ' + booking.notes,
    'Status: Pending Confirmation'
  ].join('\n');
  MailApp.sendEmail(admins, subject, body);
  MailApp.sendEmail(booking.email, 'RCC booking request received - ' + bookingId,
    'Hi ' + booking.name + ',\n\nWe received your booking request for ' + booking.date + ' at ' + booking.slotTime + '.\nBooking ID: ' + bookingId + '\n\nOur team will confirm your session by phone or WhatsApp.\n\nRemote Control Cafe');
}

function parseBody_(e) {
  var text = e && e.postData && e.postData.contents ? e.postData.contents : '{}';
  try { return JSON.parse(text); } catch (error) { throw new Error('Invalid JSON request.'); }
}

function normalizeDate_(value) {
  if (Object.prototype.toString.call(value) === '[object Date]' && !isNaN(value)) {
    return Utilities.formatDate(value, RCC_DEFAULTS.timezone, 'yyyy-MM-dd');
  }
  var text = clean_(value);
  var iso = text.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (iso) return iso[1] + '-' + iso[2] + '-' + iso[3];
  var parsed = new Date(text);
  return isNaN(parsed) ? '' : Utilities.formatDate(parsed, RCC_DEFAULTS.timezone, 'yyyy-MM-dd');
}

function normalizeSlot_(value) {
  var text = clean_(value).toUpperCase().replace(/\s*[\-\u2013]\s*\d{1,2}:\d{2}\s*[AP]M.*$/, '');
  var match = text.match(/^(\d{1,2}):(\d{2})\s*([AP]M)$/);
  return match ? String(match[1]).padStart(2, '0') + ':' + match[2] + ' ' + match[3] : text;
}

function positiveInt_(value, fallback) { var number = Number(value); return isFinite(number) && number > 0 ? Math.floor(number) : fallback; }
function clean_(value) { return String(value === null || value === undefined ? '' : value).trim(); }
function safeError_(error) { return error && error.message ? error.message : 'Unexpected server error.'; }
function json_(payload) { return ContentService.createTextOutput(JSON.stringify(payload)).setMimeType(ContentService.MimeType.JSON); }
