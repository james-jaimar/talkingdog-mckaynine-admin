

## Email Branch Attribution Bug

### Root Cause

When emails are queued (class confirmations, payment receipts, invoice emails), the `from_email` field is **never set** -- it's left as `null`. The `process-email-queue` Edge Function then falls back to the `FROM_EMAIL` env var (or `SMTP_USERNAME`), which is `delta@mckaynine.co.za`.

This means **all automated emails send from the Delta address**, regardless of branch. The Randburg class confirmation for Jane & Richard (goudgeaj@gmail.com) was correctly tagged with `branch_id = Randburg` in the queue, but the actual SMTP send used Delta's credentials because `from_email` was null.

The only emails that correctly use Randburg's address are manually composed ones where `from_email` is explicitly set (like the Mar 5 email in the queue).

### Evidence

| Email | Queue branch_id | from_email in queue | Actual sender |
|---|---|---|---|
| Randburg class confirm (10h00 EO) | Randburg | NULL | delta@ (wrong) |
| Delta class confirm (15h00 EO) | Delta | NULL | delta@ (correct by accident) |
| Manual email (Mar 5) | Randburg | randburg@ | randburg@ (correct) |

### Fix

**Option A (simple, recommended):** Update `process-email-queue` to derive the `from_email` from `branch_id` when `from_email` is null. Add a branch-to-email mapping:
- Randburg branch ID → `randburg@mckaynine.co.za`
- Everything else → default (`delta@mckaynine.co.za`)

This is a single change in the Edge Function and fixes ALL email types (confirmations, receipts, invoices) at once.

**Option B (alternative):** Set `from_email` explicitly at every queue insertion point (6+ locations across the codebase). More fragile, easy to miss new insertion points.

### Implementation (Option A)

1. Update `supabase/functions/process-email-queue/index.ts` to add a branch-to-email lookup
2. When `email.from_email` is null but `email.branch_id` is present, resolve the from address from the branch ID
3. Redeploy the Edge Function

### Files Changed
- `supabase/functions/process-email-queue/index.ts` -- add branch email resolution

