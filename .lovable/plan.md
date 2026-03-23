
Root cause is now clear: the app is inserting `status: "review"` into `email_queue`, but the live database constraint still only allows `pending/sending/sent/failed`. That mismatch causes the `400` insert failure you’re seeing in the invoice email modal.

Implementation plan:

1) Fix schema mismatch (database)
- Add a migration to update `public.email_queue` status check constraint to include `review`.
- Keep existing statuses intact (`pending`, `sending`, `sent`, `failed`) and add `review`.
- Verify the constraint after migration with a read query.

2) Close remaining invoice bypass path (code)
- Update `src/components/invoices/table/actions/InvoiceBasicActions.tsx`:
  - `handleSendClassConfirmation`: change insert status from `pending` → `review`
  - `handleSendPaymentReceipt`: change insert status from `pending` → `review`
- This ensures all invoice-related sends follow manual review, not immediate dispatch.

3) Improve error visibility (code hardening)
- In `useEmailQueue` and invoice email modal catch blocks, surface Supabase error message text in logs/toast (instead of generic “Failed to queue” only), so future failures are instantly diagnosable.

4) Verification checklist
- Send invoice from email preview modal → row inserts successfully with `status='review'`.
- Mark invoice as paid → receipt/confirmation rows insert with `status='review'`.
- Use “Send Class Confirmation” / “Send Payment Receipt” actions → rows insert with `status='review'`.
- Confirm queue processor does not send `review` items until explicitly approved.

Files to change:
- `supabase/migrations/<new_migration>.sql`
- `src/components/invoices/table/actions/InvoiceBasicActions.tsx`
- `src/hooks/useEmailQueue.ts` (error reporting only)
- `src/components/invoices/dialogs/EmailInvoicePreviewDialog.tsx` (error reporting only)
