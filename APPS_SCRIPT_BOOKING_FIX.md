# Google Apps Script Booking Fix

The website is sending the phone number correctly.

Frontend payload includes:

```json
{
  "name": "Customer Name",
  "phone": "0210000000",
  "customerPhone": "0210000000",
  "userPhone": "0210000000",
  "mobile": "0210000000",
  "mobileNumber": "0210000000",
  "email": "customer@example.com",
  "groupSize": 1,
  "date": "2026-06-05",
  "slotTime": "09:00 AM",
  "packageName": "POWER",
  "packagePrice": 45,
  "playTime": "45 Min Play",
  "toastieChoice": "",
  "coffeeChoice": ""
}
```

The live Google Apps Script endpoint currently returns:

```json
{
  "result": "error",
  "error": "phone is not defined"
}
```

That means the Apps Script `doPost()` code is referencing a bare variable named `phone` without defining it from the parsed request body.

## Required Apps Script Pattern

In Apps Script, parse the request and define `phone` before using it:

```javascript
function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents || '{}');

    const name = String(data.name || '').trim();
    const phone = String(
      data.phone ||
      data.customerPhone ||
      data.userPhone ||
      data.mobile ||
      data.mobileNumber ||
      ''
    ).trim();
    const email = String(data.email || '').trim();
    const groupSize = String(data.groupSize || '').trim();
    const date = String(data.date || '').trim();
    const slotTime = String(data.slotTime || '').trim();
    const packageName = String(data.packageName || '').trim();
    const packagePrice = String(data.packagePrice || '').trim();
    const playTime = String(data.playTime || '').trim();

    if (!name || !phone || !email || !date || !slotTime) {
      return jsonResponse({
        status: 'validation_error',
        message: 'Missing required booking details.'
      });
    }

    // Replace this with the existing sheet variable/id in the current Apps Script.
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Bookings');
    const bookingId = 'RCC-' + Utilities.formatDate(new Date(), 'Pacific/Auckland', 'yyyyMMddHHmmss');

    sheet.appendRow([
      new Date(),
      bookingId,
      name,
      phone,
      email,
      groupSize,
      date,
      slotTime,
      packageName,
      packagePrice,
      playTime
    ]);

    // Keep the existing admin/client email notification logic here.

    return jsonResponse({
      status: 'success',
      bookingId
    });
  } catch (error) {
    return jsonResponse({
      status: 'error',
      message: error.message
    });
  }
}

function jsonResponse(data) {
  return ContentService
    .createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}
```

## Important

Do not use variables like this unless they are defined first:

```javascript
sheet.appendRow([name, phone, email]);
```

Correct:

```javascript
const phone = String(data.phone || '').trim();
sheet.appendRow([name, phone, email]);
```
