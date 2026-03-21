

# Fix: addToQueue Defaults to "pending" — Bypassing Review

## Root Cause
The `addToQueue` mutation in `useEmailQueue.ts` (line 104) inserts into `email_queue` without setting `status`. The database column default is `'pending'`, so the queue processor picks these up immediately.

This affects: Invoice emails sent via `EmailInvoicePreviewDialog` (which calls `addToQueue`).

The `useMarkInvoiceAsPaid.ts` fix is already correct (explicitly sets `status: "review"`). This is the remaining gap.

## What Happened Today
- 6 payment receipt + class confirmation emails (13:05-13:06): Ady was using old cached code before today's fix deployed — those used `status: "pending"`
- 4 invoice emails (12:19-13:02): Sent via `EmailInvoicePreviewDialog` → `addToQueue` → no status set → DB default "pending" → queue processor sent them immediately

## Fix

### File: `src/hooks/useEmailQueue.ts` (line 104)
Add `status: "review"` to the insert in `addToQueue`:

```typescript
.insert({
  branch_id: currentBranch.id,
  to_email: input.to_email,
  // ... other fields
  status: "review",  // ← ADD THIS
})
```

This ensures ALL emails added via the queue hook go to review. The only way emails get sent is when an admin explicitly approves them or processes the queue.

**1 line added, 1 file.**

## Emails Already Sent Today
All 10 emails in the last hour were sent. The content was legitimate (real invoices, real receipts, real confirmations). No damage done — but they bypassed review.

