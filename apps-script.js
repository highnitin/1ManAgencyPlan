/**
 * ═══════════════════════════════════════════════════════════════
 *  1ManAgencyPlan — Google Apps Script
 *  Author: Nitin Joshi | 1managencyplan.com
 * ═══════════════════════════════════════════════════════════════
 *
 *  SETUP INSTRUCTIONS (do this once):
 *  ─────────────────────────────────────────────────────────────
 *  1. Open Google Sheets → create a new spreadsheet
 *  2. Rename it: "1ManAgencyPlan — Leads & Payments"
 *  3. Create 3 tabs:
 *       • "All Leads"
 *       • "Payments Completed"
 *       • "Failed Payments"
 *  4. In "All Leads" tab, add these headers in Row 1:
 *       Date | Time | Name | Email | WhatsApp | Niche | Funnel Link |
 *       Challenge | Price | Wants Recording | Payment Status |
 *       Amount Paid | Razorpay ID | Upsell Done | Notes
 *
 *  5. Open Extensions → Apps Script
 *  6. Paste this entire file into the editor
 *  7. Update SPREADSHEET_ID below with your sheet's ID
 *     (from the URL: https://docs.google.com/spreadsheets/d/SPREADSHEET_ID/edit)
 *  8. Deploy → New Deployment → Web App
 *       - Execute as: Me
 *       - Who has access: Anyone
 *  9. Copy the Web App URL and paste it into index.html:
 *       const APPS_SCRIPT_URL = 'YOUR_WEB_APP_URL_HERE';
 *  10. For Razorpay webhook:
 *       - Go to Razorpay Dashboard → Settings → Webhooks
 *       - Add the same Web App URL above
 *       - Events: payment.captured, payment.failed
 *       - Set a webhook secret and update RAZORPAY_WEBHOOK_SECRET below
 * ═══════════════════════════════════════════════════════════════
 */

const SPREADSHEET_ID      = 'REPLACE_WITH_YOUR_GOOGLE_SHEET_ID';
const SHEET_LEADS         = 'All Leads';
const SHEET_COMPLETED     = 'Payments Completed';
const SHEET_FAILED        = 'Failed Payments';
const RAZORPAY_WEBHOOK_SECRET = 'REPLACE_WITH_YOUR_RAZORPAY_WEBHOOK_SECRET';

// ─── MAIN ENTRY POINT ───────────────────────────────────────────────────────
function doPost(e) {
  try {
    const raw  = e.postData ? e.postData.contents : '{}';
    const data = JSON.parse(raw);

    // Route by event type
    if (data.event && data.event.startsWith('payment.')) {
      // Razorpay webhook
      return handleRazorpayWebhook(data);
    } else {
      // Form submission from landing page
      return handleFormSubmission(data);
    }
  } catch (err) {
    return ContentService
      .createTextOutput(JSON.stringify({ success: false, error: err.message }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

// Allow CORS preflight
function doGet(e) {
  return ContentService
    .createTextOutput(JSON.stringify({ status: 'ok', service: '1ManAgencyPlan' }))
    .setMimeType(ContentService.MimeType.JSON);
}

// ─── FORM SUBMISSION HANDLER ─────────────────────────────────────────────────
function handleFormSubmission(data) {
  const ss    = SpreadsheetApp.openById(SPREADSHEET_ID);
  const sheet = ss.getSheetByName(SHEET_LEADS);

  const now   = new Date();
  const date  = Utilities.formatDate(now, 'Asia/Kolkata', 'dd/MM/yyyy');
  const time  = Utilities.formatDate(now, 'Asia/Kolkata', 'HH:mm:ss');

  const row = [
    date,
    time,
    data.name             || '',
    data.email            || '',
    data.whatsapp         || '',
    data.niche            || '',
    data.funnelLink       || '',
    data.challenge        || '',
    '₹' + (data.price || '99'),
    data.wantsRecording ? 'Yes' : 'No',
    'Payment Initialized', // paymentStatus — updated by webhook
    '',                    // amountPaid    — updated by webhook
    '',                    // razorpayId    — updated by webhook
    'No',                  // upsellDone    — updated manually / in webinar
    '',                    // notes
  ];

  sheet.appendRow(row);

  return ContentService
    .createTextOutput(JSON.stringify({ success: true, message: 'Lead captured' }))
    .setMimeType(ContentService.MimeType.JSON);
}

// ─── RAZORPAY WEBHOOK HANDLER ─────────────────────────────────────────────────
function handleRazorpayWebhook(data) {
  const event   = data.event;
  const payment = data.payload && data.payload.payment && data.payload.payment.entity;

  if (!payment) {
    return ContentService
      .createTextOutput(JSON.stringify({ success: false, error: 'No payment entity' }))
      .setMimeType(ContentService.MimeType.JSON);
  }

  const razorpayId  = payment.id            || '';
  const email       = payment.email         || '';
  const amountPaise = payment.amount        || 0;
  const amountINR   = '₹' + (amountPaise / 100).toFixed(0);
  const status      = payment.status        || '';

  if (event === 'payment.captured') {
    updatePaymentStatus(email, razorpayId, 'Payment Completed', amountINR);
    copyToCompletedSheet(email, razorpayId, amountINR);
  } else if (event === 'payment.failed') {
    updatePaymentStatus(email, razorpayId, 'Payment Failed', '');
    logFailedPayment(email, razorpayId, payment);
  }

  return ContentService
    .createTextOutput(JSON.stringify({ success: true }))
    .setMimeType(ContentService.MimeType.JSON);
}

// ─── UPDATE PAYMENT STATUS IN MAIN LEADS SHEET ───────────────────────────────
function updatePaymentStatus(email, razorpayId, status, amountPaid) {
  const ss    = SpreadsheetApp.openById(SPREADSHEET_ID);
  const sheet = ss.getSheetByName(SHEET_LEADS);
  const data  = sheet.getDataRange().getValues();

  // Column indexes (0-based) — must match your header row
  const COL_EMAIL      = 3;  // D
  const COL_STATUS     = 10; // K
  const COL_AMOUNT     = 11; // L
  const COL_RAZORPAY   = 12; // M

  for (let i = 1; i < data.length; i++) { // skip header row
    if (data[i][COL_EMAIL] === email) {
      const row = i + 1; // Sheets is 1-indexed
      sheet.getRange(row, COL_STATUS   + 1).setValue(status);
      if (amountPaid) sheet.getRange(row, COL_AMOUNT  + 1).setValue(amountPaid);
      if (razorpayId) sheet.getRange(row, COL_RAZORPAY + 1).setValue(razorpayId);
      break; // update first match (most recent form submission)
    }
  }
}

// ─── COPY COMPLETED PAYMENT TO COMPLETED SHEET ───────────────────────────────
function copyToCompletedSheet(email, razorpayId, amountINR) {
  const ss          = SpreadsheetApp.openById(SPREADSHEET_ID);
  const leadsSheet  = ss.getSheetByName(SHEET_LEADS);
  const doneSheet   = ss.getSheetByName(SHEET_COMPLETED);
  const data        = leadsSheet.getDataRange().getValues();

  const COL_EMAIL = 3;

  for (let i = 1; i < data.length; i++) {
    if (data[i][COL_EMAIL] === email) {
      const rowData = data[i].slice(); // copy entire row
      rowData[10] = 'Payment Completed';
      rowData[11] = amountINR;
      rowData[12] = razorpayId;
      doneSheet.appendRow(rowData);
      break;
    }
  }
}

// ─── LOG FAILED PAYMENT ───────────────────────────────────────────────────────
function logFailedPayment(email, razorpayId, paymentEntity) {
  const ss    = SpreadsheetApp.openById(SPREADSHEET_ID);
  const sheet = ss.getSheetByName(SHEET_FAILED);

  const now    = new Date();
  const date   = Utilities.formatDate(now, 'Asia/Kolkata', 'dd/MM/yyyy');
  const time   = Utilities.formatDate(now, 'Asia/Kolkata', 'HH:mm:ss');
  const reason = (paymentEntity.error_description) || 'Unknown';
  const amount = '₹' + ((paymentEntity.amount || 0) / 100).toFixed(0);

  sheet.appendRow([
    date, time, email, razorpayId, amount,
    'Payment Failed', reason,
    JSON.stringify(paymentEntity), // full payload for debugging
  ]);

  // Also find & update the lead in the main sheet
  updatePaymentStatus(email, razorpayId, 'Payment Failed', '');
}

// ─── UTILITY: Initialize Sheet Headers (run once manually) ───────────────────
function initializeSheetHeaders() {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);

  // All Leads
  const leadsSheet = ss.getSheetByName(SHEET_LEADS);
  if (leadsSheet.getLastRow() === 0) {
    leadsSheet.appendRow([
      'Date', 'Time', 'Name', 'Email', 'WhatsApp', 'Niche',
      'Funnel Link', 'Challenge', 'Price Selected', 'Wants Recording',
      'Payment Status', 'Amount Paid', 'Razorpay ID', 'Upsell Done (L1)', 'Notes',
    ]);
    leadsSheet.getRange(1, 1, 1, 15)
      .setBackground('#1a1a2e')
      .setFontColor('#F5A623')
      .setFontWeight('bold');
    leadsSheet.setFrozenRows(1);
  }

  // Payments Completed
  const doneSheet = ss.getSheetByName(SHEET_COMPLETED);
  if (doneSheet.getLastRow() === 0) {
    doneSheet.appendRow([
      'Date', 'Time', 'Name', 'Email', 'WhatsApp', 'Niche',
      'Funnel Link', 'Challenge', 'Price Selected', 'Wants Recording',
      'Payment Status', 'Amount Paid', 'Razorpay ID', 'Upsell Done (L1)', 'Notes',
    ]);
    doneSheet.getRange(1, 1, 1, 15)
      .setBackground('#0d2e1a')
      .setFontColor('#22C55E')
      .setFontWeight('bold');
    doneSheet.setFrozenRows(1);
  }

  // Failed Payments
  const failSheet = ss.getSheetByName(SHEET_FAILED);
  if (failSheet.getLastRow() === 0) {
    failSheet.appendRow([
      'Date', 'Time', 'Email', 'Razorpay ID', 'Amount', 'Status', 'Error Reason', 'Raw Payload',
    ]);
    failSheet.getRange(1, 1, 1, 8)
      .setBackground('#2e0d0d')
      .setFontColor('#FF4444')
      .setFontWeight('bold');
    failSheet.setFrozenRows(1);
  }

  Logger.log('✅ Sheet headers initialized successfully.');
}
