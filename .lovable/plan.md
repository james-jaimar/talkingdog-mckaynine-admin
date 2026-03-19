## IMPORTANT: Lateral Thinking Reminder

When making architectural changes (e.g., moving from hardcoded to configurable systems), always proactively audit ALL downstream consumers and related flows. Don't just change the source — trace the data through creation, storage, display, and closure/completion paths. Ask: "What else touches this data? What will break or become stale if we change this?"

Examples: When class types became dynamic, we needed to also update the class closure modal's hardcoded progression map, the handlers table status cell task creation, and backfill legacy data. These weren't requested but were necessary consequences.

---

## COMPLETED: IO Sync Race Condition Fix

### Problem
Multiple concurrent sync calls for the same invoice created duplicate entries in InvoicesOnline. Three code paths (`useMarkInvoiceAsSent`, `useEmailInvoice`, `EmailInvoiceProgressDialog`) could independently trigger `syncInvoiceToIO()` before any had written `io_document_id` back to the database.

### Fix (Dual-Layer Protection)

**Layer 1 — Client-side dedup (`useIOSync.ts`):**  
Added an `inFlightSyncs` Map that tracks in-flight promises by `invoiceId:action`. If a second call arrives for the same key, it returns the existing promise instead of firing a new API call.

**Layer 2 — Server-side lock (`sync-invoice-to-io/index.ts`):**  
Before calling the IO API, atomically sets `io_sync_status = 'syncing'` with a conditional WHERE clause that only matches null/failed/pending statuses. If 0 rows match (another call already claimed it), the function polls for up to 15 seconds until the first call completes, then returns its result.

### Files Changed
- `src/hooks/invoices/useIOSync.ts` — client-side in-flight promise dedup
- `supabase/functions/sync-invoice-to-io/index.ts` — server-side atomic lock + polling

---

## Fix: Randburg Templates Showing Delta Signature

### Root Cause

Two issues are causing Randburg templates to show the Delta signature:

1. **`getSampleVariables()` in `template-renderer.ts` (line 196)** hardcodes `branchName = "McKaynine Delta"`. Every preview modal uses this function, so all previews show the Delta signature regardless of which branch is active.

2. **`getVariablesWithSignature()` (line 52-57)** generates the `{{signature}}` merge field using the hardcoded `BRANCH_SIGNATURES` map and never checks the database for a saved signature.

### Plan

**File: `src/lib/email/template-renderer.ts`**

1. Update `getSampleVariables()` to accept an optional `branchName` parameter instead of hardcoding "McKaynine Delta". Default to "McKaynine Delta" for backward compatibility.
2. Use the passed `branchName` for both the `branch_name` variable and the `signature` generation.

**Files using `getSampleVariables()` — pass current branch name:**

3. `src/components/email-templates/TemplatePreviewModal.tsx` — use `useBranch()` to get `currentBranch.name`, pass to `getSampleVariables(currentBranch?.name)`.
4. `src/components/email-templates/TemplateEditorModal.tsx` — same pattern.
5. `src/components/email-templates/TemplateConfigureModal.tsx` — same pattern.
6. `src/pages/admin/Email.tsx` — if it has inline preview calls, same fix.

**File: `src/lib/email/template-renderer.ts` — DB-aware signature**

7. Make `getVariablesWithSignature()` work with an async DB lookup: add an async variant `getVariablesWithSignatureAsync(variables, branchId)` that tries `getEmailSignatureFromDb(branchId)` first, falling back to the hardcoded signature. The sync version remains as a fallback.

This ensures:
- Previews show the correct branch signature based on the active branch
- Sending uses DB signatures when available
- Zero breaking changes — all callers that don't pass a branch name get the existing Delta default

