

# Fix: Invoice Email Fails When Sent From InvoicesList or ClientInfoCard

## Root Cause

Three places open the `EmailInvoicePreviewDialog`:

1. **`InvoiceTableActions`** — Works correctly. It first opens `EmailInvoiceProgressDialog` (syncs to IO, fetches PDF), then passes `preparedPdfBase64` to the preview dialog.
2. **`InvoicesList`** — Opens the preview dialog directly WITHOUT the progress/PDF step. `preparedPdfBase64` is always `undefined`.
3. **`ClientInfoCard`** — Same problem. Opens preview dialog without PDF preparation.

In the dialog, line 120-122 throws: `"No PDF available. Please go back and retry the email preparation."` because there's no PDF.

## Fix

Add the same two-step workflow (progress dialog then preview dialog) to both `InvoicesList` and `ClientInfoCard`.

### File 1: `src/components/invoices/InvoicesList.tsx`
- Add `EmailInvoiceProgressDialog` import and state for `preparedPdfBase64`, `emailProgressOpen`
- When "Email Invoice" is triggered, open the progress dialog first
- On PDF ready, transition to the preview dialog with the prepared PDF
- Pass `preparedPdfBase64` to `EmailInvoicePreviewDialog`

### File 2: `src/components/invoices/detail/ClientInfoCard.tsx`
- Same pattern: add progress dialog, two-step workflow
- The "Send by Email" button opens progress dialog first
- On completion, transitions to preview dialog with PDF

## Files Changed
1. `src/components/invoices/InvoicesList.tsx` — add progress dialog + PDF handoff (~15 lines)
2. `src/components/invoices/detail/ClientInfoCard.tsx` — add progress dialog + PDF handoff (~15 lines)

