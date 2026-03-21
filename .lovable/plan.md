

# Fix: Route All Invoice Emails Through Review Queue

## Problem
Two bypasses found:
1. **Mark as Paid** (`useMarkInvoiceAsPaid.ts`): Payment receipt and class confirmation emails are inserted with `status: "pending"`, which means the queue processor picks them up and sends them immediately — no admin review.
2. **Email Invoice Preview** (`EmailInvoicePreviewDialog.tsx`): After adding to queue, it calls `processQueue.mutate()` which triggers immediate sending. The email IS added with review status (via `addToQueue`), but then `processQueue` fires and sends anything pending.

## Fix

### File 1: `src/hooks/invoices/status/useMarkInvoiceAsPaid.ts`
- Line 116: Change `status: "pending"` to `status: "review"` (payment receipt emails)
- Line 145: Change `status: "pending"` to `status: "review"` (class confirmation emails)
- Update toast messages to say "queued for review" instead of "queued"

### File 2: `src/components/invoices/dialogs/EmailInvoicePreviewDialog.tsx`
- Line 164: Remove `processQueue.mutate()` — the email should sit in the queue for admin review, not be sent immediately

**3 lines changed across 2 files.**

