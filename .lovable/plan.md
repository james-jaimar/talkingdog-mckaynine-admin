

## Diagnosis: Duplicate IO Invoices for Roxy Straughton

### What happened

Roxy's March invoice (INV-McD-2603-0009) has **one** record in our database with `io_document_id: 2700647` (IO did=334). But IO shows **three** entries: did 332, 333, and 334 — all R600, all dated 01-04, all unpaid.

### Root cause: Race condition in IO sync

The idempotency check in `sync-invoice-to-io` (line 901) only works if `io_document_id` is already saved in the database:

```text
Call A reads invoice → no io_document_id → calls IO API → creates IO #332
Call B reads invoice → no io_document_id (A hasn't saved yet) → creates IO #333
Call C reads invoice → no io_document_id (still) → creates IO #334
Call C saves last → io_document_id = 334 wins
```

### How 3 calls happen simultaneously

Multiple code paths trigger `syncInvoiceToIO(id, 'invoice')` independently:

1. **Mark as Sent** (`useMarkInvoiceAsSent.ts` line 69): fires a background `.then()` sync after status update
2. **Email Invoice** (`useEmailInvoice.ts` line 40): syncs before fetching PDF for email
3. **Email Progress Dialog** (`EmailInvoiceProgressDialog.tsx` line 59): calls `syncAndGetPDF` which also syncs

If a user marks an invoice as sent and immediately clicks "Email Invoice", all three fire before any has written `io_document_id` back to the DB.

### Proposed fix: Server-side locking

Add a Postgres advisory lock or a `io_sync_status = 'syncing'` guard in the Edge Function, so only the first concurrent call creates the IO invoice.

**Approach**: Before calling the IO API, atomically set `io_sync_status = 'syncing'` with a conditional update (`WHERE io_sync_status IS NULL OR io_sync_status NOT IN ('synced', 'syncing', 'payment_synced')`). If the update affects 0 rows, another call is already in progress — return early.

### Implementation

**File: `supabase/functions/sync-invoice-to-io/index.ts`**

1. After fetching the invoice (line 697-733) and before the `action === "invoice"` handler (line 899), add a locking mechanism:
   - Attempt to UPDATE `io_sync_status = 'syncing'` WHERE current status is NOT already `synced`/`syncing`/`payment_synced`
   - If 0 rows updated → another sync is in progress, poll briefly then return existing data
   - If 1 row updated → proceed with IO API call

2. Replace the current idempotency check (lines 900-914) with the lock-based approach

3. Add a safety timeout: if `io_sync_status = 'syncing'` for more than 30 seconds, allow a retry (handles crashed syncs)

**File: `src/hooks/invoices/useIOSync.ts`**

4. Add a client-side deduplication Map to `syncInvoiceToIO()` — if a sync for the same invoice ID is already in-flight, await the existing Promise instead of firing a new one

### Technical detail

Client-side dedup (step 4) is the simpler defense and catches the most common scenario (same browser tab). Server-side lock (steps 1-3) is the robust defense that handles multiple tabs or the bulk sync banner.

Both layers together eliminate the race condition completely.

### Files changed
- `supabase/functions/sync-invoice-to-io/index.ts` — server-side lock via `io_sync_status = 'syncing'`
- `src/hooks/invoices/useIOSync.ts` — client-side in-flight dedup map

