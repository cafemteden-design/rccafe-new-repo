/**
 * RCC Cafe Apps Script V2 - backup, reporting, email and audit bridge.
 *
 * Deploy this Apps Script from cafemteden@gmail.com. Gmail sender depends on the Google account that deploys the script.
 *
 * Google Apps Script completes public booking intake first so customer bookings do not fail
 * when Supabase is slow. Supabase can be updated after this script stores and emails the booking.
 */

var RCC_V2 = {
  service: 'rcc-cafe-apps-script-v2',
  version: '2.0',
  sourceOfTruth: 'apps-script-booking-intake',
  sheetRole: 'booking-intake-reporting-email-logs',
  defaultBusinessEmail: 'cafemteden@gmail.com',
  defaultAdminEmails: 'cafemteden@gmail.com',
  defaultTimezone: 'Pacific/Auckland',
  defaultWebsiteUrl: 'https://remotecontrolcafe.co.nz',
  sheets: {
    bookings: 'BOOKINGS',
    bookingStatusLog: 'BOOKING_STATUS_LOG',
    rewardCards: 'REWARD_CARDS',
    rewardActivityLog: 'REWARD_ACTIVITY_LOG',
    rewardNotifications: 'REWARD_NOTIFICATIONS',
    websiteLeads: 'WEBSITE_LEADS',
    venueEnquiries: 'VENUE_HIRE_ENQUIRIES',
    emailRecipients: 'EMAIL_RECIPIENTS',
    emailLogs: 'EMAIL_LOGS',
    appLogs: 'APP_SCRIPT_LOGS',
    systemHealth: 'SYSTEM_HEALTH',
    settings: 'SETTINGS'
  }
};

var RCC_ACTIONS = {
  backupbooking: 'backupBooking',
  bookingcreated: 'bookingCreated',
  createbooking: 'bookingCreated', // Compatibility bridge used by the current website backup call.
  bookingcancelled: 'bookingCancelled',
  bookingupdated: 'bookingUpdated',
  rewardcardcreated: 'rewardCardCreated',
  rewardstampadded: 'rewardStampAdded',
  rewardstampremoved: 'rewardStampRemoved',
  rewardunlocked: 'rewardUnlocked',
  rewardredeemed: 'rewardRedeemed',
  welcomegiftredeemed: 'welcomeGiftRedeemed',
  rewardnotificationsent: 'rewardNotificationSent',
  websiteleadcreated: 'websiteLeadCreated',
  venueenquirycreated: 'venueEnquiryCreated',
  sendemail: 'sendEmail',
  retryfailedemail: 'retryFailedEmail',
  logevent: 'logEvent',
  updatesystemhealth: 'updateSystemHealth'
};

var RCC_SHEET_HEADERS = {};
RCC_SHEET_HEADERS[RCC_V2.sheets.bookings] = [
  'Timestamp', 'Booking ID', 'Supabase Booking ID', 'Customer Name', 'Phone', 'Email',
  'Booking Date', 'Day', 'Slot Start', 'Slot End', 'Slot Label', 'Remote Spots',
  'Gameplay Duration', 'Price Per Remote', 'Total Price', 'Toastie Selection',
  'Drink Selection', 'Food Summary', 'Per Remote Selections JSON', 'Notes', 'Status',
  'Payment Status', 'Booking Source', 'Cancellation Reason', 'Cancelled At',
  'Cancelled By', 'Customer Email Status', 'Admin Email Status', 'Last Updated'
];
RCC_SHEET_HEADERS[RCC_V2.sheets.bookingStatusLog] = [
  'Timestamp', 'Log ID', 'Booking ID', 'Supabase Booking ID', 'Customer Name',
  'Customer Email', 'Booking Date', 'Slot Label', 'Remote Spots', 'Action',
  'Old Status', 'New Status', 'Changed By', 'Changed By Email', 'Reason', 'Notes',
  'Source', 'Last Updated'
];
RCC_SHEET_HEADERS[RCC_V2.sheets.emailLogs] = [
  'Timestamp', 'Email Log ID', 'Email Type', 'Reference Type', 'Reference ID',
  'Booking ID', 'Reward Card ID', 'Customer Name', 'Recipient Email', 'Subject',
  'Status', 'Provider', 'Sent By', 'Retry Count', 'Error Message', 'Payload JSON',
  'Last Updated'
];
RCC_SHEET_HEADERS[RCC_V2.sheets.emailRecipients] = [
  'Email Address', 'Name', 'Role', 'Booking Alerts', 'Reward Alerts', 'Lead Alerts',
  'Active', 'Priority', 'Last Updated'
];
RCC_SHEET_HEADERS[RCC_V2.sheets.appLogs] = [
  'Timestamp', 'Execution ID', 'Function Name', 'Trigger Type', 'Module',
  'Reference ID', 'Status', 'Execution Time Ms', 'Rows Affected', 'Error Message',
  'Stack Trace', 'Payload JSON', 'User Email', 'Retry Count', 'Last Updated'
];
RCC_SHEET_HEADERS[RCC_V2.sheets.systemHealth] = ['Metric', 'Value', 'Last Updated'];
RCC_SHEET_HEADERS[RCC_V2.sheets.settings] = ['Setting', 'Value', 'Last Updated'];
RCC_SHEET_HEADERS[RCC_V2.sheets.rewardCards] = [
  'Timestamp', 'Reward Card ID', 'Card Number', 'Customer Name', 'Email Address',
  'Mobile Number', 'Card Status', 'Current Cycle', 'Current Stamps', 'Lifetime Stamps',
  'Total Rewards Redeemed', 'Welcome Gift Status', 'Notification Enabled', 'Last Updated'
];
RCC_SHEET_HEADERS[RCC_V2.sheets.rewardActivityLog] = [
  'Timestamp', 'Activity ID', 'Reward Card ID', 'Card Number', 'Customer Name',
  'Action', 'Old Stamps', 'New Stamps', 'Notes', 'Last Updated'
];
RCC_SHEET_HEADERS[RCC_V2.sheets.rewardNotifications] = [
  'Timestamp', 'Notification ID', 'Reward Card ID', 'Card Number', 'Customer Name',
  'Email Address', 'Notification Type', 'Status', 'Last Updated'
];
RCC_SHEET_HEADERS[RCC_V2.sheets.websiteLeads] = [
  'Timestamp', 'Lead ID', 'Name', 'Email', 'Phone', 'Message', 'Source', 'Last Updated'
];
RCC_SHEET_HEADERS[RCC_V2.sheets.venueEnquiries] = [
  'Timestamp', 'Enquiry ID', 'Name', 'Email', 'Phone', 'Event Date', 'Guest Count',
  'Message', 'Source', 'Last Updated'
];

function doGet(e) {
  var started = new Date();
  var executionId = generateId('EXEC');
  var action = safeString(e && e.parameter && e.parameter.action || 'health').toLowerCase();
  try {
    var config = getConfig();
    var result;
    if (action === 'health') {
      result = {
        success: true,
        service: RCC_V2.service,
        version: RCC_V2.version,
        sourceOfTruth: RCC_V2.sourceOfTruth,
        sheetRole: RCC_V2.sheetRole,
        timestamp: formatDateTime(new Date()),
        timezone: config.timezone
      };
      try { refreshSystemHealth_(); } catch (ignored) {}
    } else if (action === 'settings') {
      result = {
        success: true,
        businessEmail: config.businessEmail,
        websiteUrl: config.websiteUrl,
        timezone: config.timezone,
        bookingEnabled: readPublicSetting_('Booking Enabled', true),
        rewardsEnabled: readPublicSetting_('Rewards Enabled', true)
      };
    } else if (action === 'ping') {
      result = { success: true, message: 'pong' };
    } else {
      throw apiError_('UNSUPPORTED_ACTION', 'Unsupported action. Use health, settings or ping.');
    }
    safeWriteAppLog_({
      'Execution ID': executionId,
      'Function Name': 'doGet',
      'Trigger Type': 'Web App GET',
      Module: 'System',
      'Reference ID': action,
      Status: 'Success',
      'Execution Time Ms': new Date().getTime() - started.getTime(),
      'Rows Affected': 0,
      'Payload JSON': safeJson((e && e.parameter) || {})
    });
    return jsonResponse(result);
  } catch (error) {
    safeWriteAppLog_(errorLogData_(executionId, 'doGet', 'Web App GET', 'System', action, started, error, (e && e.parameter) || {}));
    return jsonResponse(errorResponse_(action, error));
  }
}

function setupRccCafeBookingSystem() {
  var spreadsheet = getSpreadsheet_();
  Object.keys(RCC_SHEET_HEADERS).forEach(function(sheetName) {
    ensureSheetWithHeaders_(spreadsheet, sheetName, RCC_SHEET_HEADERS[sheetName]);
  });
  seedEmailRecipients_();
  return {
    success: true,
    message: 'Remote Control Cafe booking sheets are ready.',
    spreadsheetName: spreadsheet.getName(),
    timestamp: formatDateTime(new Date())
  };
}

function doPost(e) {
  var started = new Date();
  var executionId = generateId('EXEC');
  var payload = {};
  var action = '';
  var lock = LockService.getScriptLock();
  var locked = false;
  try {
    payload = parseJsonPost(e);
    action = normalizeAction_(payload.action || (e && e.parameter && e.parameter.action));
    validateRequest_(payload, action);
    lock.waitLock(30000);
    locked = true;
    var result = routeAction_(action, payload);
    try { refreshSystemHealth_(); } catch (ignored) {}
    safeWriteAppLog_({
      'Execution ID': executionId,
      'Function Name': 'doPost',
      'Trigger Type': 'Web App POST',
      Module: moduleForAction_(action),
      'Reference ID': result.referenceId || referenceId_(payload),
      Status: 'Success',
      'Execution Time Ms': new Date().getTime() - started.getTime(),
      'Rows Affected': result.rowsAffected || 0,
      'Payload JSON': safeJson(payload)
    });
    result.success = result.success !== false;
    result.action = action;
    result.timestamp = formatDateTime(new Date());
    return jsonResponse(result);
  } catch (error) {
    safeWriteAppLog_(errorLogData_(executionId, 'doPost', 'Web App POST', moduleForAction_(action), referenceId_(payload), started, error, payload));
    return jsonResponse(errorResponse_(action, error));
  } finally {
    if (locked) lock.releaseLock();
  }
}

function routeAction_(action, payload) {
  if (['backupBooking', 'bookingCreated', 'bookingCancelled', 'bookingUpdated'].indexOf(action) >= 0) {
    return handleBookingAction_(action, payload);
  }
  if (['rewardCardCreated', 'rewardStampAdded', 'rewardStampRemoved', 'rewardUnlocked', 'rewardRedeemed', 'welcomeGiftRedeemed', 'rewardNotificationSent'].indexOf(action) >= 0) {
    return handleRewardAction_(action, payload);
  }
  if (action === 'websiteLeadCreated') return handleLeadAction_(RCC_V2.sheets.websiteLeads, 'Website Leads', payload);
  if (action === 'venueEnquiryCreated') return handleLeadAction_(RCC_V2.sheets.venueEnquiries, 'Venue Enquiries', payload);
  if (action === 'sendEmail') return handleSendEmail_(payload);
  if (action === 'retryFailedEmail') return handleRetryEmail_(payload);
  if (action === 'logEvent') return handleLogEvent_(payload);
  if (action === 'updateSystemHealth') return handleSystemHealth_(payload);
  throw apiError_('UNSUPPORTED_ACTION', 'Unsupported action.');
}

function handleBookingAction_(action, payload) {
  var booking = normalizeBookingPayload_(payload);
  if (!booking['Booking ID']) booking['Booking ID'] = generateBookingReference_(booking['Booking Date']);
  validateDrinkSelection_(booking);

  var existing = findBookingRecord_(booking);
  if (['bookingCancelled', 'bookingUpdated'].indexOf(action) >= 0 && !existing) {
    throw apiError_('NOT_FOUND', 'The booking backup row was not found. Run bookingCreated or backupBooking first.');
  }
  var previous = existing ? existing.values : {};
  var oldStatus = normalizeStatus(previous.Status || 'Confirmed');
  var targetStatus = booking.Status;
  if (action === 'bookingCreated' || action === 'backupBooking') targetStatus = targetStatus === 'Pending' ? 'Pending' : 'Confirmed';
  if (action === 'bookingCancelled') targetStatus = 'Cancelled';
  booking.Status = normalizeStatus(targetStatus);
  booking['Last Updated'] = formatDateTime(new Date());
  if (!booking.Timestamp) booking.Timestamp = formatDateTime(new Date());

  applyBookingAuditFields_(booking, action, payload);
  var write = upsertRow(RCC_V2.sheets.bookings, ['Booking ID', 'Supabase Booking ID'], booking);
  var merged = mergeObjects_(previous, booking);
  writeBookingStatusLog({
    Timestamp: formatDateTime(new Date()),
    'Log ID': generateId('BSL'),
    'Booking ID': merged['Booking ID'],
    'Supabase Booking ID': merged['Supabase Booking ID'],
    'Customer Name': merged['Customer Name'],
    'Customer Email': merged.Email,
    'Booking Date': merged['Booking Date'],
    'Slot Label': merged['Slot Label'],
    'Remote Spots': merged['Remote Spots'],
    Action: action,
    'Old Status': oldStatus,
    'New Status': booking.Status,
    'Changed By': safeString(payload.changed_by || payload.changedBy || payload.cancelled_by),
    'Changed By Email': safeString(payload.changed_by_email || payload.changedByEmail),
    Reason: safeString(payload.reason),
    Notes: safeString(payload.notes || payload.admin_notes),
    Source: safeString(payload.source || payload.booking_source || 'supabase-sync'),
    'Last Updated': formatDateTime(new Date())
  });

  if (action === 'bookingCreated') {
    if (write.created) {
      var emailStatus = sendBookingCreatedEmails_(merged);
      updateRowFields_(getSheet(RCC_V2.sheets.bookings), write.rowNumber, {
        'Customer Email Status': emailStatus.customer,
        'Admin Email Status': emailStatus.admin,
        'Last Updated': formatDateTime(new Date())
      });
    } else {
      updateRowFields_(getSheet(RCC_V2.sheets.bookings), write.rowNumber, {
        'Customer Email Status': firstValue_(merged['Customer Email Status'], 'Already Sent'),
        'Admin Email Status': firstValue_(merged['Admin Email Status'], 'Already Sent'),
        'Last Updated': formatDateTime(new Date())
      });
    }
  }
  if (action === 'bookingCancelled') sendBookingStatusEmail_(merged, 'Cancelled');

  return {
    success: true,
    status: 'success',
    bookingId: merged['Booking ID'],
    bookingStatus: booking.Status,
    referenceId: merged['Booking ID'],
    rowsAffected: 2,
    message: 'Booking backup and audit log updated.'
  };
}

function normalizeBookingPayload_(payload) {
  var bookingDate = firstValue_(payload.booking_date, payload.bookingDate, payload.date);
  var slotLabel = firstValue_(payload.slot_label, payload.slotLabel, payload.booking_time, payload.bookingTime, payload.slotTime, payload.slot);
  var perRemoteSelections = firstValue_(payload.per_remote_selections_json, payload.per_remote_selections, payload.perRemoteSelections, '[]');
  var foodSummary = firstValue_(payload.food_summary, payload.foodSummary);
  if (!foodSummary) foodSummary = foodSummaryFromPayload_(perRemoteSelections, payload);
  return {
    Timestamp: firstValue_(payload.timestamp, payload.created_at, payload.createdAt),
    'Booking ID': firstValue_(payload.booking_id, payload.bookingId),
    'Supabase Booking ID': firstValue_(payload.supabase_booking_id, payload.supabaseBookingId, payload.id),
    'Customer Name': firstValue_(payload.customer_name, payload.customerName, payload.name),
    Phone: firstValue_(payload.phone, payload.customer_phone, payload.customerPhone, payload.mobile),
    Email: firstValue_(payload.email, payload.customer_email, payload.customerEmail),
    'Booking Date': bookingDate,
    Day: firstValue_(payload.day, dayName_(bookingDate)),
    'Slot Start': firstValue_(payload.slot_start, payload.slotStart, startFromSlot_(slotLabel)),
    'Slot End': firstValue_(payload.slot_end, payload.slotEnd, endFromSlot_(slotLabel)),
    'Slot Label': slotLabel,
    'Remote Spots': numberOrBlank_(firstValue_(payload.remote_spots, payload.remoteSpots, payload.groupSize, payload.group_size, payload.players)),
    'Gameplay Duration': firstValue_(payload.gameplay_duration, payload.gameplayDuration, payload.packageDuration, payload.playTime),
    'Price Per Remote': numberOrBlank_(firstValue_(payload.price_per_remote, payload.pricePerRemote, payload.basePrice)),
    'Total Price': numberOrBlank_(firstValue_(payload.total_price, payload.totalPrice, payload.packagePrice, payload.price)),
    'Toastie Selection': firstValue_(payload.toastie_selection, payload.toastieSelection, payload.toastieChoice),
    'Drink Selection': normalizeDrinkChoice_(firstValue_(payload.drink_selection, payload.drinkSelection, payload.coffeeChoice)),
    'Business Hours Snapshot': safeJson(firstValue_(payload.business_hours_snapshot, payload.businessHoursSnapshot, {})),
    'Per Remote Selections JSON': typeof perRemoteSelections === 'string' ? perRemoteSelections : safeJson(perRemoteSelections),
    'Food Summary': foodSummary,
    Notes: safeString(payload.notes),
    Status: normalizeStatus(firstValue_(payload.status, payload.bookingStatus, 'Confirmed')),
    'Payment Status': firstValue_(payload.payment_status, payload.paymentStatus),
    'Booking Source': firstValue_(payload.booking_source, payload.bookingSource, payload.source, 'website'),
    'Admin Notes': firstValue_(payload.admin_notes, payload.adminNotes),
    'Cancelled By': firstValue_(payload.cancelled_by, payload.cancelledBy),
    'Cancelled At': firstValue_(payload.cancelled_at, payload.cancelledAt),
    'Cancellation Reason': firstValue_(payload.cancellation_reason, payload.cancellationReason, payload.reason),
    'Last Updated': firstValue_(payload.last_updated, payload.lastUpdated)
  };
}

function applyBookingAuditFields_(booking, action, payload) {
  var now = formatDateTime(new Date());
  if (action === 'bookingCancelled') {
    booking['Cancelled By'] = firstValue_(payload.cancelled_by, payload.cancelledBy, payload.changed_by, payload.changedBy, 'admin');
    booking['Cancelled At'] = firstValue_(payload.cancelled_at, payload.cancelledAt, now);
    booking['Cancellation Reason'] = firstValue_(payload.cancellation_reason, payload.cancellationReason, payload.reason);
  }
}

function findBookingRecord_(booking) {
  if (booking['Booking ID']) {
    var byBooking = findRowByKey(getSheet(RCC_V2.sheets.bookings), 'Booking ID', booking['Booking ID']);
    if (byBooking) return byBooking;
  }
  if (booking['Supabase Booking ID']) return findRowByKey(getSheet(RCC_V2.sheets.bookings), 'Supabase Booking ID', booking['Supabase Booking ID']);
  return null;
}

function handleRewardAction_(action, payload) {
  var reward = normalizeRewardPayload_(payload);
  requireAnyField_(reward, ['Reward Card ID', 'Card Number', 'Email Address'], 'Reward Card ID, Card Number or Email is required.');
  var existing = findRewardRecord_(reward);
  if (action !== 'rewardCardCreated' && !existing) {
    throw apiError_('NOT_FOUND', 'The reward card backup row was not found. Run rewardCardCreated first.');
  }
  reward['Last Updated'] = formatDateTime(new Date());
  if (!reward['Created At'] && action === 'rewardCardCreated') reward['Created At'] = formatDateTime(new Date());
  var write = upsertRow(RCC_V2.sheets.rewardCards, ['Reward Card ID', 'Card Number', 'Email Address'], reward);
  var eventType = rewardEventType_(action);
  writeRewardActivityLog({
    Timestamp: formatDateTime(new Date()),
    'Activity ID': generateId('RA'),
    'Reward Card ID': reward['Reward Card ID'],
    'Card Number': reward['Card Number'],
    'Customer Name': reward['Customer Name'],
    'Event Type': eventType,
    'Stamp Count': reward['Current Stamps'],
    'Cycle Number': reward['Current Cycle'],
    'Gift Name': firstValue_(payload.gift_name, payload.giftName, payload.offer_title),
    'Performed By': firstValue_(payload.performed_by, payload.performedBy),
    'Staff Email': firstValue_(payload.staff_email, payload.staffEmail),
    Notes: safeString(payload.notes)
  });

  var rowsAffected = 2;
  if (action === 'rewardNotificationSent') {
    appendLog(RCC_V2.sheets.rewardNotifications, dataForExistingHeaders_(RCC_V2.sheets.rewardNotifications, payload, {
      Timestamp: formatDateTime(new Date()),
      'Reward Card ID': reward['Reward Card ID'],
      'Card Number': reward['Card Number'],
      'Customer Name': reward['Customer Name'],
      'Email Address': reward['Email Address'],
      'Last Updated': formatDateTime(new Date())
    }));
    rowsAffected += 1;
  }

  if (action === 'rewardCardCreated') sendRewardWelcomeEmail_(reward, payload);
  if (action === 'rewardNotificationSent' && reward['Email Address']) sendRewardOfferEmail_(reward, payload);

  return {
    success: true,
    referenceId: firstValue_(reward['Reward Card ID'], reward['Card Number']),
    rowsAffected: rowsAffected,
    message: 'Reward backup and activity log updated.'
  };
}

function findRewardRecord_(reward) {
  var sheet = getSheet(RCC_V2.sheets.rewardCards);
  var fields = ['Reward Card ID', 'Card Number', 'Email Address'];
  for (var i = 0; i < fields.length; i += 1) {
    if (!reward[fields[i]]) continue;
    var found = findRowByKey(sheet, fields[i], reward[fields[i]]);
    if (found) return found;
  }
  return null;
}

function normalizeRewardPayload_(payload) {
  return {
    'Created At': firstValue_(payload.created_at, payload.createdAt),
    'Updated At': firstValue_(payload.updated_at, payload.updatedAt),
    'Supabase User ID': firstValue_(payload.supabase_user_id, payload.supabaseUserId),
    'Reward Card ID': firstValue_(payload.reward_card_id, payload.rewardCardId, payload.id),
    'Card Number': firstValue_(payload.card_number, payload.cardNumber, payload.card_id, payload.cardId),
    'Card Token': firstValue_(payload.card_token, payload.cardToken, payload.secure_token, payload.token),
    'Customer Name': firstValue_(payload.customer_name, payload.customerName, payload.name),
    'Email Address': firstValue_(payload.email_address, payload.emailAddress, payload.email),
    'Mobile Number': firstValue_(payload.mobile_number, payload.mobileNumber, payload.phone, payload.mobile),
    'Date Of Birth': firstValue_(payload.date_of_birth, payload.dateOfBirth, payload.dob),
    'Card Status': firstValue_(payload.card_status, payload.cardStatus),
    'Current Cycle': numberOrBlank_(firstValue_(payload.current_cycle, payload.currentCycle, payload.cycle)),
    'Current Stamps': numberOrBlank_(firstValue_(payload.current_stamps, payload.currentStamps, payload.stampCount)),
    'Lifetime Stamps': numberOrBlank_(firstValue_(payload.lifetime_stamps, payload.lifetimeStamps, payload.totalStamps)),
    'Total Rewards Redeemed': numberOrBlank_(firstValue_(payload.total_rewards_redeemed, payload.totalRewardsRedeemed)),
    'Last Visit Date': firstValue_(payload.last_visit_date, payload.lastVisitDate),
    'Last Stamp Date': firstValue_(payload.last_stamp_date, payload.lastStampDate),
    'Last Reward Date': firstValue_(payload.last_reward_date, payload.lastRewardDate),
    'Welcome Gift Status': firstValue_(payload.welcome_gift_status, payload.welcomeGiftStatus),
    'Notification Enabled': booleanOrBlank_(firstValue_(payload.notification_enabled, payload.notificationEnabled)),
    'Home Screen Shortcut Enabled': booleanOrBlank_(firstValue_(payload.home_screen_shortcut_enabled, payload.homeScreenShortcutEnabled)),
    'Last Login Date': firstValue_(payload.last_login_date, payload.lastLoginDate),
    'Customer Notes': firstValue_(payload.customer_notes, payload.customerNotes, payload.notes),
    'Last Updated': firstValue_(payload.last_updated, payload.lastUpdated)
  };
}

function rewardEventType_(action) {
  var map = {
    rewardCardCreated: 'Card Created',
    rewardStampAdded: 'Stamp Added',
    rewardStampRemoved: 'Stamp Removed',
    rewardUnlocked: 'Reward Unlocked',
    rewardRedeemed: 'Reward Redeemed',
    welcomeGiftRedeemed: 'Welcome Gift Redeemed',
    rewardNotificationSent: 'Notification Sent'
  };
  return map[action] || action;
}

function handleLeadAction_(sheetName, recipientType, payload) {
  var email = firstValue_(payload.email, payload.email_address, payload.customer_email);
  requireAnyRaw_(payload, ['email', 'email_address', 'customer_email', 'phone', 'mobile'], 'Lead email or phone is required.');
  var data = dataForExistingHeaders_(sheetName, payload, {
    Timestamp: firstValue_(payload.timestamp, formatDateTime(new Date())),
    'Last Updated': formatDateTime(new Date())
  });
  appendLog(sheetName, data);
  if (getConfig().enableAdminEmails) {
    var recipients = getActiveRecipients(recipientType);
    var reference = referenceId_(payload) || generateId(recipientType === 'Website Leads' ? 'LEAD' : 'VENUE');
    sendEmailSafe(recipients.join(','), 'New RCC ' + recipientType.toLowerCase() + ' - ' + reference,
      '<p>A new ' + escapeHtml_(recipientType.toLowerCase()) + ' submission was received.</p><pre>' + escapeHtml_(safeJson(payload)) + '</pre>',
      'A new ' + recipientType.toLowerCase() + ' submission was received.\n\n' + safeJson(payload),
      { emailType: recipientType, referenceType: recipientType, referenceId: reference, customerName: firstValue_(payload.customer_name, payload.name), recipientEmail: recipients.join(',') });
  }
  return { success: true, referenceId: referenceId_(payload), rowsAffected: 1, message: recipientType + ' entry backed up.' };
}

function handleSendEmail_(payload) {
  var emailType = safeString(payload.emailType || payload.email_type).toLowerCase().replace(/[_\s-]+/g, '_');
  if (emailType === 'booking_confirmed') return handleBookingConfirmedEmail_(payload);
  if (emailType === 'booking_rejected') return handleBookingRejectedEmail_(payload);
  if (emailType === 'booking_cancelled') return handleBookingCancelledEmail_(payload);
  requireAnyRaw_(payload, ['to', 'recipient_email', 'recipientEmail'], 'Recipient email is required.');
  if (!safeString(payload.subject)) throw apiError_('VALIDATION_ERROR', 'Email subject is required.');
  var result = sendEmailSafe(firstValue_(payload.to, payload.recipient_email, payload.recipientEmail), payload.subject,
    firstValue_(payload.html_body, payload.htmlBody, payload.body), firstValue_(payload.plain_body, payload.plainBody, payload.body), payload.metadata || payload);
  return { success: result.status === 'Sent', referenceId: result.emailLogId, rowsAffected: 1, message: result.message, emailStatus: result.status };
}

function handleBookingConfirmedEmail_(payload) {
  var booking = normalizeBookingPayload_(payload);
  var recipientEmail = firstValue_(booking.Email, payload.email, payload.customer_email);
  if (!recipientEmail) throw apiError_('VALIDATION_ERROR', 'Customer email is required for confirmation email.');
  var bookingId = firstValue_(booking['Booking ID'], payload.booking_id);
  if (!bookingId) throw apiError_('VALIDATION_ERROR', 'Booking ID is required.');

  if (isDuplicateEmail_('Booking Confirmed', bookingId, recipientEmail)) {
    return { success: true, referenceId: bookingId, rowsAffected: 0, message: 'Confirmation email already sent.', emailStatus: 'Already Sent', duplicate: true };
  }

  var config = getConfig();
  var customerName = firstValue_(booking['Customer Name'], payload.customer_name, 'Customer');
  var cancellationText = 'To request a cancellation, please reply to this email or contact Remote Control Cafe with your booking reference, name, booking date and booking time. Cancellation requests should be submitted at least 30 minutes before the scheduled booking time. Your booking remains confirmed until you receive a cancellation confirmation from our team.';

  var htmlBody = brandedEmailHtml_('Booking Confirmed',
    '<p>Hi ' + escapeHtml_(customerName) + ',</p>' +
    '<p>Great news! Your Remote Control Cafe booking has been <strong style="color:#16a34a">confirmed</strong>.</p>' +
    bookingDetailsHtml_(booking) +
    '<p><strong>Status:</strong> <span style="color:#16a34a">Confirmed</span></p>' +
    '<p style="margin-top:16px;padding:12px;background:#f0fdf4;border-radius:8px;border:1px solid #bbf7d0">' +
    '<strong>What to expect:</strong> Please arrive at Remote Control Cafe at your booked time. Your toastie and coffee will be prepared fresh for you.</p>' +
    '<p style="font-size:13px;color:#6b7280">' + escapeHtml_(cancellationText) + '</p>' +
    '<p>See you soon!<br><strong>Remote Control Cafe</strong><br>' + escapeHtml_(config.businessEmail) + '</p>');

  var plainBody = 'Hi ' + customerName + ',\n\n' +
    'Great news! Your Remote Control Cafe booking has been confirmed.\n\n' +
    bookingDetailsText_(booking) +
    '\nStatus: Confirmed\n\n' +
    'What to expect: Please arrive at Remote Control Cafe at your booked time. Your toastie and coffee will be prepared fresh for you.\n\n' +
    cancellationText + '\n\n' +
    'See you soon!\nRemote Control Cafe\n' + config.businessEmail;

  var customerResult = sendEmailSafe(recipientEmail, 'Booking Confirmed - ' + bookingId, htmlBody, plainBody,
    bookingEmailMetadata_(booking, 'Booking Confirmed', recipientEmail));

  if (config.enableAdminEmails) {
    var admins = uniqueEmails_(config.adminEmails);
    sendEmailSafe(admins.join(','), 'Booking Approved - ' + bookingId,
      brandedEmailHtml_('Booking Approved', '<p>Booking <strong>' + escapeHtml_(bookingId) + '</strong> has been approved and the customer has been notified.</p>' + bookingDetailsHtml_(booking) + '<p><strong>Status:</strong> Confirmed</p>'),
      'Booking ' + bookingId + ' has been approved.\n\n' + bookingDetailsText_(booking) + '\nStatus: Confirmed',
      bookingEmailMetadata_(booking, 'Admin Booking Approved', admins.join(',')));
  }

  updateBookingEmailStatus_(booking, 'Customer Email Status', customerResult.status);

  return { success: customerResult.status === 'Sent', referenceId: customerResult.emailLogId, bookingId: bookingId, rowsAffected: 1, message: customerResult.message, emailStatus: customerResult.status };
}

function handleBookingRejectedEmail_(payload) {
  var booking = normalizeBookingPayload_(payload);
  var recipientEmail = firstValue_(booking.Email, payload.email, payload.customer_email);
  if (!recipientEmail) throw apiError_('VALIDATION_ERROR', 'Customer email is required for rejection email.');
  var bookingId = firstValue_(booking['Booking ID'], payload.booking_id);
  if (!bookingId) throw apiError_('VALIDATION_ERROR', 'Booking ID is required.');

  if (isDuplicateEmail_('Booking Rejected', bookingId, recipientEmail)) {
    return { success: true, referenceId: bookingId, rowsAffected: 0, message: 'Rejection email already sent.', emailStatus: 'Already Sent', duplicate: true };
  }

  var config = getConfig();
  var customerName = firstValue_(booking['Customer Name'], payload.customer_name, 'Customer');
  var rejectionReason = safeString(firstValue_(payload.rejectionReason, payload.rejection_reason, booking['Cancellation Reason'], 'Unfortunately, we are unable to accommodate your booking at this time.'));
  var bookingLink = config.websiteUrl + '/booking';

  var htmlBody = brandedEmailHtml_('Booking Update',
    '<p>Hi ' + escapeHtml_(customerName) + ',</p>' +
    '<p>Thank you for your interest in Remote Control Cafe. Unfortunately, we are unable to confirm your booking at this time.</p>' +
    bookingDetailsHtml_(booking) +
    '<p><strong>Status:</strong> <span style="color:#dc2626">Not Available</span></p>' +
    '<p><strong>Reason:</strong> ' + escapeHtml_(rejectionReason) + '</p>' +
    '<p style="margin-top:16px;padding:12px;background:#fef3c7;border-radius:8px;border:1px solid #fde68a">' +
    'We would love to welcome you at another time! Please choose a different date or time slot that works for you.</p>' +
    '<p style="margin-top:12px"><a href="' + escapeHtml_(bookingLink) + '" style="display:inline-block;padding:12px 24px;background:#ff6b1a;color:#ffffff;text-decoration:none;border-radius:8px;font-weight:bold">Choose Another Slot</a></p>' +
    '<p style="margin-top:16px">If you have any questions, please reply to this email or contact us directly.</p>' +
    '<p>Kind regards,<br><strong>Remote Control Cafe</strong><br>' + escapeHtml_(config.businessEmail) + '</p>');

  var plainBody = 'Hi ' + customerName + ',\n\n' +
    'Thank you for your interest in Remote Control Cafe. Unfortunately, we are unable to confirm your booking at this time.\n\n' +
    bookingDetailsText_(booking) +
    '\nStatus: Not Available\n' +
    'Reason: ' + rejectionReason + '\n\n' +
    'We would love to welcome you at another time! Please choose a different date or time slot:\n' +
    bookingLink + '\n\n' +
    'If you have any questions, please reply to this email or contact us directly.\n\n' +
    'Kind regards,\nRemote Control Cafe\n' + config.businessEmail;

  var customerResult = sendEmailSafe(recipientEmail, 'Booking Update - ' + bookingId, htmlBody, plainBody,
    bookingEmailMetadata_(booking, 'Booking Rejected', recipientEmail));

  if (config.enableAdminEmails) {
    var admins = uniqueEmails_(config.adminEmails);
    sendEmailSafe(admins.join(','), 'Booking Rejected - ' + bookingId,
      brandedEmailHtml_('Booking Rejected', '<p>Booking <strong>' + escapeHtml_(bookingId) + '</strong> has been rejected and the customer has been notified.</p>' + bookingDetailsHtml_(booking) + '<p><strong>Reason:</strong> ' + escapeHtml_(rejectionReason) + '</p>'),
      'Booking ' + bookingId + ' has been rejected.\n\n' + bookingDetailsText_(booking) + '\nReason: ' + rejectionReason,
      bookingEmailMetadata_(booking, 'Admin Booking Rejected', admins.join(',')));
  }

  updateBookingEmailStatus_(booking, 'Customer Email Status', customerResult.status);

  return { success: customerResult.status === 'Sent', referenceId: customerResult.emailLogId, bookingId: bookingId, rowsAffected: 1, message: customerResult.message, emailStatus: customerResult.status };
}

function handleBookingCancelledEmail_(payload) {
  var booking = normalizeBookingPayload_(payload);
  booking.Status = 'Cancelled';
  sendBookingStatusEmail_(booking, 'Cancelled');
  return { success: true, referenceId: firstValue_(booking['Booking ID'], payload.booking_id), rowsAffected: 1, message: 'Cancellation email processed.' };
}

function isDuplicateEmail_(emailType, bookingId, recipientEmail) {
  try {
    var sheet = getSheet(RCC_V2.sheets.emailLogs);
    var headers = getHeaders(sheet);
    if (sheet.getLastRow() < 2) return false;
    var rows = sheet.getRange(2, 1, sheet.getLastRow() - 1, headers.length).getDisplayValues();
    var typeIndex = headerIndex_(headers, 'Email Type');
    var refIndex = headerIndex_(headers, 'Booking ID');
    var recipientIndex = headerIndex_(headers, 'Recipient Email');
    var statusIndex = headerIndex_(headers, 'Status');
    if (typeIndex < 0 || refIndex < 0 || statusIndex < 0) return false;
    var targetType = normalizeKey_(emailType);
    var targetRef = normalizeKey_(bookingId);
    var targetRecipient = normalizeKey_(recipientEmail);
    for (var i = 0; i < rows.length; i += 1) {
      if (normalizeKey_(rows[i][typeIndex]) === targetType &&
          normalizeKey_(rows[i][refIndex]) === targetRef &&
          (recipientIndex < 0 || normalizeKey_(rows[i][recipientIndex]) === targetRecipient) &&
          normalizeKey_(rows[i][statusIndex]) === 'sent') {
        return true;
      }
    }
  } catch (ignored) {}
  return false;
}

function updateBookingEmailStatus_(booking, field, status) {
  try {
    var existing = findBookingRecord_(booking);
    if (existing) {
      updateRowFields_(getSheet(RCC_V2.sheets.bookings), existing.rowNumber, {
        'Customer Email Status': status,
        'Last Updated': formatDateTime(new Date())
      });
    }
  } catch (ignored) {}
}

function handleRetryEmail_(payload) {
  var id = firstValue_(payload.email_log_id, payload.emailLogId);
  if (!id) throw apiError_('VALIDATION_ERROR', 'Email Log ID is required.');
  var sheet = getSheet(RCC_V2.sheets.emailLogs);
  var record = findRowByKey(sheet, 'Email Log ID', id);
  if (!record) throw apiError_('NOT_FOUND', 'Email log entry was not found.');
  if (safeString(record.values.Status).toLowerCase() !== 'failed') throw apiError_('INVALID_STATE', 'Only failed email entries can be retried.');
  var retryPayload;
  try { retryPayload = JSON.parse(record.values['Payload JSON'] || '{}'); } catch (ignored) { retryPayload = {}; }
  if (!retryPayload.to || !retryPayload.subject) throw apiError_('RETRY_DATA_MISSING', 'Stored retry details are incomplete.');
  updateRowFields_(sheet, record.rowNumber, { Status: 'Retrying', 'Retry Count': Number(record.values['Retry Count'] || 0) + 1, 'Last Updated': formatDateTime(new Date()) });
  var result = sendEmailSafe(retryPayload.to, retryPayload.subject, retryPayload.htmlBody, retryPayload.plainBody, mergeObjects_(retryPayload.metadata || {}, { retryCount: Number(record.values['Retry Count'] || 0) + 1 }));
  return { success: result.status === 'Sent', referenceId: result.emailLogId, rowsAffected: 2, message: result.message };
}

function handleLogEvent_(payload) {
  var sheetName = safeString(payload.sheet_name || payload.sheetName || RCC_V2.sheets.appLogs);
  var allowed = [RCC_V2.sheets.appLogs, RCC_V2.sheets.bookingStatusLog, RCC_V2.sheets.rewardActivityLog];
  if (allowed.indexOf(sheetName) < 0) throw apiError_('VALIDATION_ERROR', 'Unsupported log destination.');
  appendLog(sheetName, dataForExistingHeaders_(sheetName, payload, { Timestamp: formatDateTime(new Date()) }));
  return { success: true, rowsAffected: 1, referenceId: referenceId_(payload), message: 'Event logged.' };
}

function handleSystemHealth_(payload) {
  var metrics = payload.metrics && typeof payload.metrics === 'object' ? payload.metrics : {};
  metrics['Last Sync Time'] = formatDateTime(new Date());
  updateSystemHealthData_(metrics);
  return { success: true, rowsAffected: Object.keys(metrics).length, message: 'System health updated.' };
}

function refreshSystemHealth_() {
  var failedEmails = countRowsByStatus_(RCC_V2.sheets.emailLogs, 'Status', ['Failed']);
  var failedRuns = countRowsByStatus_(RCC_V2.sheets.appLogs, 'Status', ['Failed']);
  var confirmedBookings = countRowsByStatus_(RCC_V2.sheets.bookings, 'Status', ['Confirmed']);
  var pendingBookings = countRowsByStatus_(RCC_V2.sheets.bookings, 'Status', ['Pending']);
  updateSystemHealthData_({
    'Apps Script Status': 'Healthy',
    'Email Status': failedEmails === 0 ? 'No Failed Emails' : failedEmails + ' Failed Email(s)',
    'Last Sync Time': formatDateTime(new Date()),
    'Failed Emails': failedEmails,
    'Failed Apps Script Runs': failedRuns,
    'Confirmed Bookings': confirmedBookings,
    'Pending Bookings': pendingBookings
  });
}

function countRowsByStatus_(sheetName, statusHeader, acceptedStatuses) {
  var sheet = getSheet(sheetName);
  var headers = getHeaders(sheet);
  var index = headerIndex_(headers, statusHeader);
  if (index < 0 || sheet.getLastRow() < 2) return 0;
  var accepted = acceptedStatuses.map(normalizeKey_);
  var values = sheet.getRange(2, index + 1, sheet.getLastRow() - 1, 1).getDisplayValues();
  return values.reduce(function(total, row) { return total + (accepted.indexOf(normalizeKey_(row[0])) >= 0 ? 1 : 0); }, 0);
}

function sendBookingCreatedEmails_(booking) {
  var config = getConfig();
  var details = bookingDetailsText_(booking);
  var adminStatus = 'Skipped';
  var customerStatus = 'Skipped';
  var isPending = safeString(booking.Status).toLowerCase() === 'pending';
  var statusLabel = isPending ? 'Pending Approval' : 'Confirmed';
  if (config.enableAdminEmails) {
    var admins = uniqueEmails_(config.adminEmails);
    var adminSubject = isPending ? 'New Booking Request (Pending) - ' : 'New Confirmed Booking - ';
    var adminResult = sendEmailSafe(admins.join(','), adminSubject + booking['Booking ID'],
      brandedEmailHtml_(isPending ? 'New Booking Request' : 'New Confirmed Booking',
        '<p>A new RCC booking ' + (isPending ? 'request has been received and requires approval.' : 'has been confirmed.') + '</p>' +
        bookingDetailsHtml_(booking) +
        '<p><strong>Status:</strong> <span style="color:' + (isPending ? '#d97706' : '#16a34a') + '">' + statusLabel + '</span></p>' +
        (isPending ? '<p style="margin-top:12px;padding:12px;background:#fef3c7;border-radius:8px;border:1px solid #fde68a"><strong>Action required:</strong> Please review and approve or reject this booking in the admin panel.</p>' : '')),
      (isPending ? 'New Booking Request (Pending Approval)' : 'New Confirmed Booking') + '\n\n' + details + '\nStatus: ' + statusLabel + (isPending ? '\n\nAction required: Please review and approve or reject this booking in the admin panel.' : ''),
      bookingEmailMetadata_(booking, 'Admin Booking Created', admins.join(',')));
    adminStatus = adminResult.status;
  }
  if (config.enableCustomerEmails && booking.Email) {
    if (isPending) {
      var pendingResult = sendEmailSafe(booking.Email, 'Booking Request Received - ' + booking['Booking ID'],
        brandedEmailHtml_('Booking Request Received',
          '<p>Hi ' + escapeHtml_(booking['Customer Name']) + ',</p>' +
          '<p>Thank you for your booking request at Remote Control Cafe! We have received your details and our team will review your booking shortly.</p>' +
          bookingDetailsHtml_(booking) +
          '<p><strong>Status:</strong> <span style="color:#d97706">Pending Approval</span></p>' +
          '<p style="padding:12px;background:#fef3c7;border-radius:8px;border:1px solid #fde68a">You will receive a confirmation email once your booking has been approved. Most bookings are reviewed within a few hours.</p>' +
          '<p>Remote Control Cafe<br>' + escapeHtml_(config.businessEmail) + '</p>'),
        'Hi ' + booking['Customer Name'] + ',\n\nThank you for your booking request at Remote Control Cafe! We have received your details and our team will review your booking shortly.\n\n' + details + '\nStatus: Pending Approval\n\nYou will receive a confirmation email once your booking has been approved. Most bookings are reviewed within a few hours.\n\nRemote Control Cafe\n' + config.businessEmail,
        bookingEmailMetadata_(booking, 'Customer Booking Pending', booking.Email));
      customerStatus = pendingResult.status;
    } else {
      var cancellationText = 'To request a cancellation, please reply to this email or contact Remote Control Cafe with your booking reference, name, booking date and booking time. Cancellation requests should be submitted at least 30 minutes before the scheduled booking time. Your booking remains confirmed until you receive a cancellation confirmation from our team.';
      var customerResult = sendEmailSafe(booking.Email, 'Booking Confirmed - ' + booking['Booking ID'],
        brandedEmailHtml_('Booking Confirmed', '<p>Hi ' + escapeHtml_(booking['Customer Name']) + ',</p><p>Your Remote Control Cafe booking is confirmed.</p>' + bookingDetailsHtml_(booking) + '<p><strong>Status:</strong> Confirmed</p><p>' + escapeHtml_(cancellationText) + '</p><p>Remote Control Cafe<br>' + escapeHtml_(config.businessEmail) + '</p>'),
        'Hi ' + booking['Customer Name'] + ',\n\nYour Remote Control Cafe booking is confirmed.\n\n' + details + '\nStatus: Confirmed\n\n' + cancellationText + '\n\nRemote Control Cafe\n' + config.businessEmail,
        bookingEmailMetadata_(booking, 'Customer Booking Created', booking.Email));
      customerStatus = customerResult.status;
    }
  }
  return { admin: adminStatus, customer: customerStatus };
}

function sendBookingStatusEmail_(booking, status) {
  if (!getConfig().enableCustomerEmails || !booking.Email) return;
  var config = getConfig();
  var subject;
  var intro;
  if (status === 'Cancelled') {
    subject = 'Booking Cancelled - ' + booking['Booking ID'];
    intro = 'Your RCC Cafe booking has been cancelled.';
  } else {
    subject = 'RCC booking update - ' + booking['Booking ID'];
    intro = 'Your RCC Cafe booking has been updated.';
  }
  var reason = safeString(booking['Cancellation Reason']);
  var reasonHtml = reason ? '<p><strong>Cancellation Reason:</strong> ' + escapeHtml_(reason) + '</p>' : '';
  var reasonText = reason ? '\nCancellation Reason: ' + reason : '';
  sendEmailSafe(booking.Email, subject,
    brandedEmailHtml_(status === 'Cancelled' ? 'Booking Cancelled' : 'Booking Updated', '<p>Hi ' + escapeHtml_(booking['Customer Name']) + ',</p><p>' + escapeHtml_(intro) + '</p>' + bookingDetailsHtml_(booking) + '<p><strong>Status:</strong> ' + escapeHtml_(status) + '</p>' + reasonHtml + '<p>Remote Control Cafe<br>' + escapeHtml_(config.businessEmail) + '</p>'),
    'Hi ' + booking['Customer Name'] + ',\n\n' + intro + '\n\n' + bookingDetailsText_(booking) + '\nStatus: ' + status + reasonText + '\n\nRemote Control Cafe\n' + config.businessEmail,
    bookingEmailMetadata_(booking, 'Customer Booking ' + status, booking.Email));
}

function sendRewardWelcomeEmail_(reward, payload) {
  if (!getConfig().enableRewardEmails || !reward['Email Address']) return;
  var cardLink = firstValue_(payload.card_url, payload.cardUrl, payload.reward_card_url);
  var gift = firstValue_(payload.welcome_gift, payload.welcomeGift, payload.gift_name, 'Welcome Gift');
  var plain = 'Hi ' + reward['Customer Name'] + ',\n\nYour RCC Reward Card has been created.\n\nCard Number: ' + reward['Card Number'] + '\nCurrent Stamps: ' + firstValue_(reward['Current Stamps'], 0) + '\nWelcome Gift: ' + gift + (cardLink ? '\nCard Link: ' + cardLink : '') + '\n\nRemote Control Cafe';
  sendEmailSafe(reward['Email Address'], 'Welcome to RCC Rewards', '<p>' + escapeHtml_(plain).replace(/\n/g, '<br>') + '</p>', plain,
    { emailType: 'Reward Welcome', referenceType: 'Reward Card', referenceId: reward['Reward Card ID'], rewardCardId: reward['Reward Card ID'], customerName: reward['Customer Name'], recipientEmail: reward['Email Address'] });
}

function sendRewardOfferEmail_(reward, payload) {
  if (!getConfig().enableRewardEmails || !reward['Email Address']) return;
  var offer = firstValue_(payload.offer_title, payload.offerTitle, payload.title, 'RCC Reward Offer');
  var details = firstValue_(payload.offer_description, payload.offerDescription, payload.message);
  var validUntil = firstValue_(payload.valid_until, payload.validUntil);
  var plain = 'Hi ' + reward['Customer Name'] + ',\n\nA new RCC offer is available for you.\n\nOffer: ' + offer + '\nDetails: ' + details + (validUntil ? '\nValid Until: ' + validUntil : '');
  sendEmailSafe(reward['Email Address'], 'New RCC Reward Offer', '<p>' + escapeHtml_(plain).replace(/\n/g, '<br>') + '</p>', plain,
    { emailType: 'Reward Offer', referenceType: 'Reward Card', referenceId: reward['Reward Card ID'], rewardCardId: reward['Reward Card ID'], customerName: reward['Customer Name'], recipientEmail: reward['Email Address'] });
}

function bookingDetailsText_(booking) {
  return ['Booking ID: ' + booking['Booking ID'], 'Customer: ' + booking['Customer Name'], 'Phone: ' + booking.Phone, 'Email: ' + booking.Email,
    'Date: ' + booking['Booking Date'], 'Time: ' + booking['Slot Label'], 'Remote Spots: ' + booking['Remote Spots'], 'Gameplay: ' + booking['Gameplay Duration'],
    'Food & Coffee:', booking['Food Summary'] || ('Remote 1: ' + booking['Toastie Selection'] + ' + ' + booking['Drink Selection']),
    'Drink: ' + booking['Drink Selection'], 'Total: NZD $' + booking['Total Price'], 'Notes: ' + booking.Notes].join('\n');
}

function bookingDetailsHtml_(booking) {
  return '<table cellpadding="5" cellspacing="0">' + [
    ['Booking ID', booking['Booking ID']], ['Customer', booking['Customer Name']], ['Phone', booking.Phone], ['Email', booking.Email], ['Date', booking['Booking Date']],
    ['Time', booking['Slot Label']], ['Remote Spots', booking['Remote Spots']], ['Gameplay', booking['Gameplay Duration']],
    ['Selected Toastie', booking['Toastie Selection']], ['Selected Drink', booking['Drink Selection']],
    ['Food & Drink', booking['Food Summary'] || ('Remote 1: ' + booking['Toastie Selection'] + ' + ' + booking['Drink Selection'])],
    ['Total', 'NZD $' + booking['Total Price']], ['Notes', booking.Notes]
  ].map(function(row) { return '<tr><td><strong>' + escapeHtml_(row[0]) + '</strong></td><td>' + escapeHtml_(row[1]) + '</td></tr>'; }).join('') + '</table>';
}

function brandedEmailHtml_(heading, body) {
  return '<div style="font-family:Arial,sans-serif;color:#1b1b1b;line-height:1.5">' +
    '<div style="border-bottom:3px solid #ff6b1a;padding-bottom:12px;margin-bottom:16px">' +
    '<h1 style="margin:0;color:#1b1b1b;font-size:24px">' + escapeHtml_(heading) + '</h1>' +
    '<p style="margin:4px 0 0;color:#d94f00;font-weight:bold">Remote Control Cafe</p>' +
    '</div>' + body + '</div>';
}

function foodSummaryFromPayload_(value, payload) {
  var rows = value;
  if (typeof rows === 'string') {
    try { rows = JSON.parse(rows); } catch (error) { rows = []; }
  }
  if (Array.isArray(rows) && rows.length) {
    return rows.map(function(item, index) {
      return 'Remote ' + firstValue_(item.remote, index + 1) + ': ' + firstValue_(item.toastie, item.toastieSelection, 'Not selected') + ' + ' + firstValue_(item.coffee, item.drink, item.drinkSelection, 'Not selected');
    }).join('\n');
  }
  var toastie = firstValue_(payload.toastie_selection, payload.toastieSelection, payload.toastieChoice);
  var coffee = firstValue_(payload.drink_selection, payload.drinkSelection, payload.coffeeChoice);
  return toastie || coffee ? 'Remote 1: ' + toastie + ' + ' + coffee : '';
}

function bookingEmailMetadata_(booking, type, recipient) {
  return { emailType: type, referenceType: 'Booking', referenceId: booking['Booking ID'], bookingId: booking['Booking ID'], customerName: booking['Customer Name'], recipientEmail: recipient };
}

function jsonResponse(payload) {
  return ContentService.createTextOutput(JSON.stringify(payload)).setMimeType(ContentService.MimeType.JSON);
}

function parseJsonPost(e) {
  var text = e && e.postData && e.postData.contents;
  if (!text) throw apiError_('EMPTY_REQUEST', 'JSON request body is required.');
  try { return JSON.parse(text); } catch (error) { throw apiError_('INVALID_JSON', 'Request body must be valid JSON.'); }
}

function validateRequest_(payload, action) {
  var secret = getConfig().webhookSecret;
  if (!secret) return;
  var supplied = safeString(payload.webhook_secret || payload.webhookSecret || payload.token);
  if (supplied !== secret) throw apiError_('UNAUTHORISED', 'Request token is missing or invalid.');
  delete payload.webhook_secret;
  delete payload.webhookSecret;
  delete payload.token;
}

function validateDrinkSelection_(booking) {
  var drink = safeString(booking['Drink Selection']);
  if (['Any Black', 'Flat White / Latte', 'Hot Choco', 'Cappuccino', 'Fluffy'].indexOf(drink) < 0) {
    throw apiError_('VALIDATION_ERROR', 'Drink Selection must be a valid RCC coffee choice.');
  }
}

function normalizeDrinkChoice_(value) {
  var drink = safeString(value);
  var key = drink.toLowerCase();
  if (['any black', 'black', 'long black', 'americano', 'short black', 'espresso', 'coffee'].indexOf(key) >= 0) return 'Any Black';
  if (['flat white / latte', 'flat white', 'latte'].indexOf(key) >= 0) return 'Flat White / Latte';
  if (['hot choco / cappuccino', 'hot chocolate', 'hot choco'].indexOf(key) >= 0) return 'Hot Choco';
  if (key === 'cappuccino') return 'Cappuccino';
  if (key === 'fluffy') return 'Fluffy';
  return drink;
}

function getConfig() {
  var properties = PropertiesService.getScriptProperties();
  return {
    spreadsheetId: safeString(properties.getProperty('SPREADSHEET_ID')),
    businessEmail: safeString(properties.getProperty('BUSINESS_EMAIL') || RCC_V2.defaultBusinessEmail),
    adminEmails: safeString(properties.getProperty('ADMIN_EMAILS') || RCC_V2.defaultAdminEmails),
    timezone: safeString(properties.getProperty('TIMEZONE') || RCC_V2.defaultTimezone),
    websiteUrl: safeString(properties.getProperty('WEBSITE_URL') || RCC_V2.defaultWebsiteUrl).replace(/\/$/, ''),
    supabaseUrl: safeString(properties.getProperty('SUPABASE_URL')),
    supabaseAnonKey: safeString(properties.getProperty('SUPABASE_ANON_KEY')),
    webhookSecret: safeString(properties.getProperty('WEBHOOK_SECRET')),
    enableAdminEmails: propertyBoolean_(properties.getProperty('ENABLE_ADMIN_EMAILS'), true),
    enableCustomerEmails: propertyBoolean_(properties.getProperty('ENABLE_CUSTOMER_EMAILS'), true),
    enableRewardEmails: propertyBoolean_(properties.getProperty('ENABLE_REWARD_EMAILS'), true)
  };
}

function getSpreadsheet_() {
  var id = getConfig().spreadsheetId;
  if (id) return SpreadsheetApp.openById(id);
  var active = SpreadsheetApp.getActiveSpreadsheet();
  if (active) return active;
  throw apiError_('CONFIG_MISSING', 'SPREADSHEET_ID Script Property is required.');
}

function getSheet(name) {
  var sheet = getSpreadsheet_().getSheetByName(name);
  if (!sheet) throw apiError_('SHEET_NOT_FOUND', 'Required sheet tab is missing: ' + name);
  return sheet;
}

function ensureSheetWithHeaders_(spreadsheet, name, headers) {
  var sheet = spreadsheet.getSheetByName(name) || spreadsheet.insertSheet(name);
  if (sheet.getLastRow() === 0 || sheet.getLastColumn() === 0) {
    sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
    sheet.setFrozenRows(1);
    return sheet;
  }
  var existing = getHeaders(sheet);
  var missing = headers.filter(function(header) { return headerIndex_(existing, header) < 0; });
  if (missing.length) {
    sheet.getRange(1, existing.length + 1, 1, missing.length).setValues([missing]);
    sheet.setFrozenRows(1);
  }
  return sheet;
}

function seedEmailRecipients_() {
  var sheet = getSheet(RCC_V2.sheets.emailRecipients);
  var existing = findRowByKey(sheet, 'Email Address', RCC_V2.defaultBusinessEmail);
  if (existing) {
    updateRowFields_(sheet, existing.rowNumber, {
      'Email Address': RCC_V2.defaultBusinessEmail,
      Name: 'Remote Control Cafe',
      Role: 'Primary',
      'Booking Alerts': true,
      'Reward Alerts': true,
      'Lead Alerts': true,
      Active: true,
      Priority: 1,
      'Last Updated': formatDateTime(new Date())
    });
    return;
  }
  appendLog(RCC_V2.sheets.emailRecipients, {
    'Email Address': RCC_V2.defaultBusinessEmail,
    Name: 'Remote Control Cafe',
    Role: 'Primary',
    'Booking Alerts': true,
    'Reward Alerts': true,
    'Lead Alerts': true,
    Active: true,
    Priority: 1,
    'Last Updated': formatDateTime(new Date())
  });
}

function getHeaders(sheet) {
  if (!sheet || sheet.getLastColumn() < 1) throw apiError_('HEADERS_MISSING', 'Sheet headers are missing.');
  return sheet.getRange(1, 1, 1, sheet.getLastColumn()).getDisplayValues()[0].map(safeString);
}

function findRowByKey(sheet, keyName, keyValue) {
  if (!safeString(keyValue)) return null;
  var headers = getHeaders(sheet);
  var index = headerIndex_(headers, keyName);
  if (index < 0 || sheet.getLastRow() < 2) return null;
  var values = sheet.getRange(2, 1, sheet.getLastRow() - 1, headers.length).getDisplayValues();
  var target = normalizeKey_(keyValue);
  for (var i = 0; i < values.length; i += 1) {
    if (normalizeKey_(values[i][index]) === target) return { rowNumber: i + 2, values: rowObject_(headers, values[i]) };
  }
  return null;
}

function upsertRow(sheetName, keyFields, dataObject) {
  var sheet = getSheet(sheetName);
  var existing = null;
  for (var i = 0; i < keyFields.length; i += 1) {
    if (dataObject[keyFields[i]]) {
      existing = findRowByKey(sheet, keyFields[i], dataObject[keyFields[i]]);
      if (existing) break;
    }
  }
  var headers = getHeaders(sheet);
  if (existing) {
    updateRowFields_(sheet, existing.rowNumber, dataObject);
    return { created: false, rowNumber: existing.rowNumber, previous: existing.values };
  }
  var row = headers.map(function(header) { return valueForHeader_(dataObject, header); });
  sheet.appendRow(row);
  return { created: true, rowNumber: sheet.getLastRow(), previous: {} };
}

function appendLog(sheetName, dataObject) {
  var sheet = getSheet(sheetName);
  var headers = getHeaders(sheet);
  sheet.appendRow(headers.map(function(header) { return valueForHeader_(dataObject, header); }));
  return sheet.getLastRow();
}

function sendEmailSafe(to, subject, htmlBody, plainBody, metadata) {
  var recipients = uniqueEmails_(to);
  var emailLogId = generateId('EL');
  var meta = metadata || {};
  var retryPayload = { to: recipients.join(','), subject: safeString(subject), htmlBody: safeString(htmlBody), plainBody: safeString(plainBody), metadata: meta };
  if (!recipients.length) {
    writeEmailLog(emailLogData_(emailLogId, meta, '', subject, 'Skipped', 'No active recipient email.', retryPayload));
    return { status: 'Skipped', emailLogId: emailLogId, message: 'Email skipped because no active recipient was found.' };
  }
  try {
    MailApp.sendEmail({ to: recipients.join(','), subject: safeString(subject), body: safeString(plainBody || stripHtml_(htmlBody)), htmlBody: safeString(htmlBody || plainBody), name: 'Remote Control Cafe Auckland' });
    writeEmailLog(emailLogData_(emailLogId, meta, recipients.join(','), subject, 'Sent', '', retryPayload));
    return { status: 'Sent', emailLogId: emailLogId, message: 'Email sent.' };
  } catch (error) {
    writeEmailLog(emailLogData_(emailLogId, meta, recipients.join(','), subject, 'Failed', safeErrorMessage_(error), retryPayload));
    return { status: 'Failed', emailLogId: emailLogId, message: 'Email could not be sent. It was logged for retry.' };
  }
}

function getActiveRecipients(type) {
  var sheet;
  try { sheet = getSheet(RCC_V2.sheets.emailRecipients); } catch (error) { return uniqueEmails_(getConfig().adminEmails); }
  var headers = getHeaders(sheet);
  if (sheet.getLastRow() < 2) return [];
  var rows = sheet.getRange(2, 1, sheet.getLastRow() - 1, headers.length).getDisplayValues().map(function(row) { return rowObject_(headers, row); });
  var filtered = rows.filter(function(row) {
    return isTrue_(row.Active) && isTrue_(row[type]) && safeString(row['Email Address']);
  }).sort(function(a, b) {
    var roleA = safeString(a.Role).toLowerCase() === 'primary' ? -1000 : 0;
    var roleB = safeString(b.Role).toLowerCase() === 'primary' ? -1000 : 0;
    return (roleA + Number(a.Priority || 999)) - (roleB + Number(b.Priority || 999));
  });
  var emails = filtered.map(function(row) { return row['Email Address']; });
  return uniqueEmails_(emails.join(','));
}

function writeEmailLog(data) { return appendLog(RCC_V2.sheets.emailLogs, data); }
function writeAppScriptLog(data) { return appendLog(RCC_V2.sheets.appLogs, mergeObjects_({ Timestamp: formatDateTime(new Date()), 'Last Updated': formatDateTime(new Date()), 'User Email': effectiveUserEmail_(), 'Retry Count': 0 }, data)); }
function writeBookingStatusLog(data) { return appendLog(RCC_V2.sheets.bookingStatusLog, data); }
function writeRewardActivityLog(data) { return appendLog(RCC_V2.sheets.rewardActivityLog, data); }

function normalizeStatus(status) {
  var value = safeString(status).toLowerCase().replace(/[_-]+/g, ' ');
  if (value === 'pending') return 'Pending';
  if (value === 'confirmed' || value === 'approved') return 'Confirmed';
  if (value === 'rejected') return 'Rejected';
  if (value === 'cancelled' || value === 'canceled') return 'Cancelled';
  if (value === 'completed') return 'Completed';
  if (value === 'no show' || value === 'noshow') return 'No Show';
  return 'Confirmed';
}

function formatDateTime(date) {
  return Utilities.formatDate(date instanceof Date ? date : new Date(date), getConfig().timezone, "yyyy-MM-dd'T'HH:mm:ssXXX");
}

function generateId(prefix) {
  var stamp = Utilities.formatDate(new Date(), getConfig().timezone, 'yyyyMMdd-HHmmss');
  return safeString(prefix).toUpperCase() + '-' + stamp + '-' + Utilities.getUuid().slice(0, 6).toUpperCase();
}

function generateBookingReference_(bookingDate) {
  var dateText = safeString(bookingDate);
  var compactDate = dateText ? dateText.replace(/[^0-9]/g, '').slice(0, 8) : Utilities.formatDate(new Date(), getConfig().timezone, 'yyyyMMdd');
  if (compactDate.length !== 8) compactDate = Utilities.formatDate(new Date(), getConfig().timezone, 'yyyyMMdd');
  var stamp = Utilities.formatDate(new Date(), getConfig().timezone, 'HHmmss');
  return 'RCC-' + compactDate + '-' + stamp + Utilities.getUuid().slice(0, 3).toUpperCase();
}

function safeString(value) { return String(value === null || value === undefined ? '' : value).trim(); }

function safeJson(value) {
  try {
    return JSON.stringify(value, function(key, item) {
      var normalized = normalizeKey_(key);
      if (['dateofbirth', 'dob', 'cardtoken', 'securetoken', 'supabaseanonkey', 'servicerolekey'].indexOf(normalized) >= 0) return '[REDACTED]';
      return item;
    });
  } catch (error) { return '{"error":"Unable to serialize payload"}'; }
}

function updateSystemHealthData_(metrics) {
  var sheet = getSheet(RCC_V2.sheets.systemHealth);
  var marker = 'System Health Data';
  var values = sheet.getDataRange().getDisplayValues();
  var startRow = 0;
  for (var i = 0; i < values.length; i += 1) if (safeString(values[i][0]) === marker) { startRow = i + 1; break; }
  if (!startRow) {
    startRow = Math.max(sheet.getLastRow() + 2, 1);
    sheet.getRange(startRow, 1).setValue(marker);
    sheet.getRange(startRow + 1, 1, 1, 3).setValues([['Metric', 'Value', 'Last Updated']]);
  }
  var firstDataRow = startRow + 2;
  var lastRow = Math.max(sheet.getLastRow(), firstDataRow - 1);
  var existing = lastRow >= firstDataRow ? sheet.getRange(firstDataRow, 1, lastRow - firstDataRow + 1, 3).getDisplayValues() : [];
  Object.keys(metrics).forEach(function(metric) {
    var found = -1;
    for (var j = 0; j < existing.length; j += 1) if (safeString(existing[j][0]) === metric) { found = j; break; }
    var row = found >= 0 ? firstDataRow + found : Math.max(sheet.getLastRow() + 1, firstDataRow);
    sheet.getRange(row, 1, 1, 3).setValues([[metric, metrics[metric], formatDateTime(new Date())]]);
    if (found < 0) existing.push([metric, metrics[metric], formatDateTime(new Date())]);
  });
}

function readPublicSetting_(label, fallback) {
  try {
    var sheet = getSheet(RCC_V2.sheets.settings);
    var data = sheet.getDataRange().getDisplayValues();
    for (var i = 0; i < data.length; i += 1) if (normalizeKey_(data[i][0]) === normalizeKey_(label)) return isTrue_(data[i][1]);
  } catch (ignored) {}
  return fallback;
}

function dataForExistingHeaders_(sheetName, payload, overrides) {
  var headers = getHeaders(getSheet(sheetName));
  var data = overrides || {};
  headers.forEach(function(header) {
    if (Object.prototype.hasOwnProperty.call(data, header)) return;
    var normalized = normalizeKey_(header);
    Object.keys(payload || {}).some(function(key) {
      if (normalizeKey_(key) === normalized) { data[header] = payload[key]; return true; }
      return false;
    });
  });
  return data;
}

function updateRowFields_(sheet, rowNumber, dataObject) {
  var headers = getHeaders(sheet);
  var range = sheet.getRange(rowNumber, 1, 1, headers.length);
  var row = range.getValues()[0];
  headers.forEach(function(header, index) {
    var value = valueForHeader_(dataObject, header);
    if (value !== undefined && value !== '') row[index] = value;
  });
  range.setValues([row]);
}

function valueForHeader_(object, header) {
  if (Object.prototype.hasOwnProperty.call(object, header)) return object[header];
  var target = normalizeKey_(header);
  var keys = Object.keys(object || {});
  for (var i = 0; i < keys.length; i += 1) if (normalizeKey_(keys[i]) === target) return object[keys[i]];
  return '';
}

function rowObject_(headers, row) {
  var object = {};
  headers.forEach(function(header, index) { object[header] = row[index]; });
  return object;
}

function headerIndex_(headers, name) {
  var target = normalizeKey_(name);
  for (var i = 0; i < headers.length; i += 1) if (normalizeKey_(headers[i]) === target) return i;
  return -1;
}

function normalizeKey_(value) { return safeString(value).toLowerCase().replace(/[^a-z0-9]/g, ''); }
function normalizeAction_(value) { var action = RCC_ACTIONS[normalizeKey_(value)]; if (!action) throw apiError_('UNSUPPORTED_ACTION', 'A supported action is required.'); return action; }
function moduleForAction_(action) { if (/^booking/i.test(action) || action === 'backupBooking') return 'Bookings'; if (/^reward/i.test(action) || action === 'welcomeGiftRedeemed') return 'Rewards'; if (/lead|venue/i.test(action)) return 'Leads'; if (/email/i.test(action)) return 'Email'; return 'System'; }
function referenceId_(payload) { return firstValue_(payload.booking_id, payload.bookingId, payload.reward_card_id, payload.rewardCardId, payload.card_number, payload.cardNumber, payload.reference_id, payload.referenceId, payload.lead_id, payload.enquiry_id); }
function firstValue_() { for (var i = 0; i < arguments.length; i += 1) if (arguments[i] !== undefined && arguments[i] !== null && arguments[i] !== '') return arguments[i]; return ''; }
function numberOrBlank_(value) { if (value === '') return ''; var number = Number(value); return isFinite(number) ? number : ''; }
function booleanOrBlank_(value) { return value === '' ? '' : isTrue_(value); }
function isTrue_(value) { return value === true || ['true', 'yes', '1', 'active', 'enabled'].indexOf(safeString(value).toLowerCase()) >= 0; }
function propertyBoolean_(value, fallback) { return value === null || value === undefined || value === '' ? fallback : isTrue_(value); }
function mergeObjects_(left, right) { var result = {}; Object.keys(left || {}).forEach(function(key) { result[key] = left[key]; }); Object.keys(right || {}).forEach(function(key) { if (right[key] !== '' && right[key] !== undefined) result[key] = right[key]; }); return result; }
function uniqueEmails_(value) { var seen = {}; return safeString(value).split(',').map(function(item) { return safeString(item).toLowerCase(); }).filter(function(item) { if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(item) || seen[item]) return false; seen[item] = true; return true; }); }
function safeErrorMessage_(error) { return safeString(error && error.message || 'Unexpected server error.'); }
function apiError_(code, message) { var error = new Error(message); error.code = code; return error; }
function errorResponse_(action, error) { return { success: false, action: action || '', message: safeClientMessage_(error), error_code: error && error.code || 'INTERNAL_ERROR', timestamp: formatDateTime(new Date()) }; }
function safeClientMessage_(error) { return error && error.code ? safeErrorMessage_(error) : 'The request could not be completed. Please try again or contact RCC.'; }
function effectiveUserEmail_() { try { return Session.getEffectiveUser().getEmail(); } catch (ignored) { return ''; } }
function safeWriteAppLog_(data) { try { writeAppScriptLog(data); } catch (error) { console.error('APP_SCRIPT_LOGS write failed: ' + safeErrorMessage_(error)); } }
function errorLogData_(id, fn, trigger, module, reference, started, error, payload) { return { 'Execution ID': id, 'Function Name': fn, 'Trigger Type': trigger, Module: module || 'System', 'Reference ID': reference, Status: 'Failed', 'Execution Time Ms': new Date().getTime() - started.getTime(), 'Rows Affected': 0, 'Error Message': safeErrorMessage_(error), 'Stack Trace': safeString(error && error.stack), 'Payload JSON': safeJson(payload) }; }
function requireFields_(object, fields, message) { for (var i = 0; i < fields.length; i += 1) if (!safeString(object[fields[i]])) throw apiError_('VALIDATION_ERROR', message || fields[i] + ' is required.'); }
function requireAnyField_(object, fields, message) { for (var i = 0; i < fields.length; i += 1) if (safeString(object[fields[i]])) return; throw apiError_('VALIDATION_ERROR', message); }
function requireAnyRaw_(object, fields, message) { for (var i = 0; i < fields.length; i += 1) if (safeString(object[fields[i]])) return; throw apiError_('VALIDATION_ERROR', message); }
function startFromSlot_(slot) { var parts = safeString(slot).split(/\s[-–]\s/); return parts[0] || ''; }
function endFromSlot_(slot) { var parts = safeString(slot).split(/\s[-–]\s/); return parts.length > 1 ? parts[1] : ''; }
function dayName_(value) { if (!value) return ''; var date = new Date(value + 'T12:00:00'); return isNaN(date) ? '' : Utilities.formatDate(date, getConfig().timezone, 'EEEE'); }
function escapeHtml_(value) { return safeString(value).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#039;'); }
function stripHtml_(value) { return safeString(value).replace(/<br\s*\/?>/gi, '\n').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim(); }

function emailLogData_(id, meta, recipients, subject, status, error, retryPayload) {
  return {
    Timestamp: formatDateTime(new Date()), 'Email Log ID': id, 'Email Type': firstValue_(meta.emailType, 'Transactional'), 'Reference Type': safeString(meta.referenceType),
    'Reference ID': safeString(meta.referenceId), 'Booking ID': safeString(meta.bookingId), 'Reward Card ID': safeString(meta.rewardCardId), 'Customer Name': safeString(meta.customerName),
    'Recipient Email': recipients, Subject: safeString(subject), Status: status, Provider: 'Apps Script / MailApp', 'Sent By': effectiveUserEmail_(),
    'Retry Count': Number(meta.retryCount || 0), 'Error Message': safeString(error), 'Payload JSON': safeJson(retryPayload), 'Last Updated': formatDateTime(new Date())
  };
}
