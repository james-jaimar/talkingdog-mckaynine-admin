
Fix plan: Delta paid invoice sync still failing (our side, not IO)

1) Confirmed failure mode (runtime)
- The function is returning HTTP 409 to the frontend (`Edge Function returned a non-2xx`).
- Edge logs show repeated lock failures before any IO create call:
  - `code: 42703`
  - `message: column invoices.io_sync_status does not exist`
- This happens in the server-side lock step, so the request never reaches the actual IO invoice/payment write path.

2) Root cause (why this persists after schema reload + redeploy)
- In `supabase/functions/sync-invoice-to-io/index.ts`, lock acquisition uses:
  - `update(...)`
  - `.or("io_sync_status.is.null,io_sync_status.eq.failed,io_sync_status.eq.pending")`
  - `.select("id").maybeSingle()`
- This matches a known PostgREST query-builder bug on `UPDATE + OR + return representation`, which can throw a misleading `column <table>.<col> does not exist` even when the column exists.
- That’s why cache reload/redeploy didn’t solve it: it’s query shape, not actual schema absence.

3) Code changes to implement
File: `supabase/functions/sync-invoice-to-io/index.ts` (lock section around current lines ~916-971)

- Replace the current lock query from “`update + or + select(id)`” to “`update + or` with `count: 'exact'` and no representation select”.
- Determine lock acquisition by affected row count (`count === 1`), not returned row object.
- Add explicit branch handling:
  - If `lockError` exists: return `500` immediately (do not continue into polling).
  - If `count === 0`: treat as true contention and run the existing poll loop.
  - If `count === 1`: proceed with sync.

Why this fix:
- Avoids the PostgREST representation path causing the false 42703.
- Preserves atomic lock semantics and current idempotency design.
- Prevents masking true DB errors as fake “concurrent sync” 409s.

4) Optional hardening (same file, same block)
- Add structured log fields for `lock_count`, `lock_error_code`, and invoice id.
- Keep 409 only for genuine contention/timeouts; use 500 for lock query failures.

5) Validation plan
- Re-run sync on failed invoices:
  - `INV-McD-2603-0020`
  - `INV-McD-2603-0025`
- Expected:
  - No new `42703` lock errors in edge logs.
  - At least one “lock acquired/proceeding” log.
  - Successful IO document/payment fields populated on invoice rows.
  - Frontend modal should show success instead of “0 succeeded, 2 failed”.

Technical details
- This is not an IO-side outage.
- It is a backend lock-query bug in our edge function caused by a PostgREST edge case with OR-filtered updates returning representation.
- No database schema migration is required for this specific fix.
