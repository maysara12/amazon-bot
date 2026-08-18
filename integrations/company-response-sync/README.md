# 007 Company Response Sync

This bridge reads the company response sheet with the signed-in Google account and sends completed responses to the Supabase `sync-company-responses` Edge Function every 5 minutes.

## Source
- Spreadsheet ID: `1ERxbYhollpSw2d1RG9RKIbC9hl5EV9ghwvB-R_EYgvQ`
- Sheet: `Sheet1`
- Columns: A timestamp, C order ID, D amount, E rider ID, M validity, N comment, O validated by.

## One-time installation
1. Create a standalone Google Apps Script project using the Google account that can view the company response sheet.
2. Copy `Code.gs` from this folder into the project.
3. Open Project Settings -> Script Properties.
4. Add property `SYNC_KEY` with the private key supplied separately. Never commit the key to GitHub or put it directly in source code.
5. Run `installCompanyResponseSync()` once and authorize the requested Google permissions.
6. Run `runCompanyResponseSyncTest()` once.
7. Check Executions. A successful run should return HTTP 200 and an `ok: true` response.

## Runtime behavior
- Runs every 5 minutes.
- Reads only the latest 500 sheet rows per cycle.
- Supabase deduplicates using a SHA-256 fingerprint.
- Matches primarily by normalized Order ID and verifies Rider ID and Amount when supplied.
- Known company wording is normalized into approved/rejected/already-refunded states.
- Unknown or contradictory wording is never guessed; it is stored as a conflict for admin review.
- Historical unmatched rows before 2026-08-18 are ignored to avoid polluting the new system.

## Functions
- `installCompanyResponseSync()` — install/reset the 5-minute trigger.
- `syncCompanyResponses()` — run one sync cycle.
- `runCompanyResponseSyncTest()` — run and print current status.
- `showCompanyResponseSyncStatus()` — print last run/status/response.
- `removeCompanyResponseSyncTrigger()` — stop scheduled sync.
