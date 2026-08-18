const COMPANY_RESPONSE_SYNC = Object.freeze({
  SPREADSHEET_ID: '1ERxbYhollpSw2d1RG9RKIbC9hl5EV9ghwvB-R_EYgvQ',
  SHEET_NAME: 'Sheet1',
  ENDPOINT: 'https://gektzjagrxqgcbhyeihm.supabase.co/functions/v1/sync-company-responses',
  MAX_ROWS_PER_SYNC: 500,
  GO_LIVE_DATE: new Date('2026-08-18T00:00:00+03:00')
});

/**
 * One-time setup:
 * 1) Project Settings -> Script properties -> add SYNC_KEY.
 * 2) Run installCompanyResponseSync() once and approve permissions.
 * 3) Run syncCompanyResponses() once for a manual test.
 */
function installCompanyResponseSync() {
  const key = PropertiesService.getScriptProperties().getProperty('SYNC_KEY');
  if (!key) throw new Error('Missing Script Property: SYNC_KEY');

  ScriptApp.getProjectTriggers()
    .filter(t => t.getHandlerFunction() === 'syncCompanyResponses')
    .forEach(t => ScriptApp.deleteTrigger(t));

  ScriptApp.newTrigger('syncCompanyResponses')
    .timeBased()
    .everyMinutes(5)
    .create();

  PropertiesService.getScriptProperties().setProperties({
    COMPANY_SYNC_INSTALLED_AT: new Date().toISOString(),
    COMPANY_SYNC_STATUS: 'INSTALLED'
  });

  console.log('007 Company Response Sync installed. Runs every 5 minutes.');
}

function syncCompanyResponses() {
  const props = PropertiesService.getScriptProperties();
  const syncKey = props.getProperty('SYNC_KEY');
  if (!syncKey) throw new Error('Missing Script Property: SYNC_KEY');

  const ss = SpreadsheetApp.openById(COMPANY_RESPONSE_SYNC.SPREADSHEET_ID);
  const sheet = ss.getSheetByName(COMPANY_RESPONSE_SYNC.SHEET_NAME);
  if (!sheet) throw new Error('Company response sheet tab not found: ' + COMPANY_RESPONSE_SYNC.SHEET_NAME);

  const lastRow = sheet.getLastRow();
  if (lastRow < 2) {
    props.setProperties({
      COMPANY_SYNC_LAST_RUN: new Date().toISOString(),
      COMPANY_SYNC_LAST_RESULT: JSON.stringify({ ok: true, message: 'No data rows' })
    });
    return;
  }

  const dataRowCount = lastRow - 1;
  const rowsToRead = Math.min(dataRowCount, COMPANY_RESPONSE_SYNC.MAX_ROWS_PER_SYNC);
  const startRow = lastRow - rowsToRead + 1;

  // A:O = 15 columns. Relevant columns:
  // A timestamp, C order ID, D amount, E rider ID, M validity, N comment, O validated by.
  const values = sheet.getRange(startRow, 1, rowsToRead, 15).getValues();

  const rows = values
    .map((r, index) => ({
      rowNumber: startRow + index,
      timestamp: toIsoOrText_(r[0]),
      orderId: safeValue_(r[2]),
      amount: safeValue_(r[3]),
      riderId: safeValue_(r[4]),
      validity: safeValue_(r[12]),
      comment: safeValue_(r[13]),
      validatedBy: safeValue_(r[14])
    }))
    .filter(r => String(r.orderId || '').trim() !== '')
    .filter(r => String(r.validity || '').trim() !== '' || String(r.comment || '').trim() !== '');

  if (!rows.length) {
    props.setProperties({
      COMPANY_SYNC_LAST_RUN: new Date().toISOString(),
      COMPANY_SYNC_LAST_RESULT: JSON.stringify({ ok: true, message: 'No completed company responses in scan window' })
    });
    return;
  }

  const response = UrlFetchApp.fetch(COMPANY_RESPONSE_SYNC.ENDPOINT, {
    method: 'post',
    contentType: 'application/json',
    headers: {
      'x-007-sync-key': syncKey
    },
    payload: JSON.stringify({ rows }),
    muteHttpExceptions: true
  });

  const status = response.getResponseCode();
  const body = response.getContentText();

  props.setProperties({
    COMPANY_SYNC_LAST_RUN: new Date().toISOString(),
    COMPANY_SYNC_LAST_HTTP_STATUS: String(status),
    COMPANY_SYNC_LAST_RESULT: body.slice(0, 9000),
    COMPANY_SYNC_STATUS: status >= 200 && status < 300 ? 'OK' : 'ERROR'
  });

  if (status < 200 || status >= 300) {
    throw new Error('Company response sync failed. HTTP ' + status + ': ' + body);
  }

  console.log(body);
}

function runCompanyResponseSyncTest() {
  syncCompanyResponses();
  showCompanyResponseSyncStatus();
}

function showCompanyResponseSyncStatus() {
  const props = PropertiesService.getScriptProperties();
  const status = {
    installedAt: props.getProperty('COMPANY_SYNC_INSTALLED_AT'),
    status: props.getProperty('COMPANY_SYNC_STATUS'),
    lastRun: props.getProperty('COMPANY_SYNC_LAST_RUN'),
    lastHttpStatus: props.getProperty('COMPANY_SYNC_LAST_HTTP_STATUS'),
    lastResult: props.getProperty('COMPANY_SYNC_LAST_RESULT')
  };
  console.log(JSON.stringify(status, null, 2));
  return status;
}

function removeCompanyResponseSyncTrigger() {
  ScriptApp.getProjectTriggers()
    .filter(t => t.getHandlerFunction() === 'syncCompanyResponses')
    .forEach(t => ScriptApp.deleteTrigger(t));
  PropertiesService.getScriptProperties().setProperty('COMPANY_SYNC_STATUS', 'STOPPED');
}

function safeValue_(value) {
  if (value === null || value === undefined) return '';
  if (value instanceof Date) return value.toISOString();
  return value;
}

function toIsoOrText_(value) {
  if (value instanceof Date) return value.toISOString();
  if (value === null || value === undefined || value === '') return null;
  const parsed = new Date(value);
  if (!isNaN(parsed.getTime())) return parsed.toISOString();
  return String(value).trim();
}
