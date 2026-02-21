

# Fix IO Invoice Dating and Add Monthly Bulk Sync Control

## Two Issues Being Solved

### Issue 1: Invoice Date Mismatch with IO
Classes starting on Jan 29-31 get invoiced with that date, but when marked as "February billing" (via `franchise_report_month`), IO still receives the January date. The IO API has no "update invoice" endpoint, so we must set the correct date at creation time.

**Fix:** When syncing to IO, use the `franchise_report_month` field (e.g., `2026-02`) instead of `issued_date` (e.g., `2026-01-29`) to construct both:
- The IO invoice date (first of the franchise month)
- The IO invoice prefix (e.g., `McD-2602-` instead of `McD-2601-`)

This ensures IO invoices align with your franchise reporting periods.

### Issue 2: Bulk Sync Shows All 348 Invoices at Once
The banner currently lumps everything together, including ~300 invoices from 2025 that should not be synced.

**Fix:** Replace the single banner with a per-month breakdown showing each month's unsynced count with individual "Sync" buttons.

---

## Technical Details

### File 1: `supabase/functions/sync-invoice-to-io/index.ts`

**Change the date logic in `createIOInvoice`:**
- Currently uses `invoice.issued_date` for `InvoiceDate` and the prefix
- Will check for `franchise_report_month` first (e.g., `2026-02`)
- If present, use the 1st of that month as the IO invoice date (e.g., `2026-02-01`)
- Fall back to `issued_date` if no franchise month is set

**Fetch `franchise_report_month` from the database:**
- The main handler already fetches the invoice record -- add `franchise_report_month` to that SELECT
- Pass it through the `InvoiceData` interface and into `createIOInvoice`

### File 2: `src/components/invoices/BulkIOSyncBanner.tsx`

**Replace the single banner with grouped-by-month display:**
- Query also fetches `issued_date` and `franchise_report_month`
- Group invoices by their effective month (franchise_report_month or issued_date month)
- Display each month as a row: "January 2026: 52 invoices [Sync Now]"
- Each month has its own sync button
- Progress dialog works per-month when syncing
- Months are shown in chronological order, most recent first

### File 3: No database changes needed

The `franchise_report_month` field already exists on the invoices table and is already populated for all invoices.

