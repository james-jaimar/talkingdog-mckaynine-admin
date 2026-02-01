

# URGENT FIX: Disable Test Mode in IO Sync

## Problem
TEST_MODE is enabled in the `sync-invoice-to-io` edge function, causing ALL invoices (except for `jimmybhawkins@gmail.com`) to be skipped when syncing to InvoicesOnline.

**Evidence from logs:**
```text
Test mode: Skipping sync for joy@officespaceonline.co.za (not in test list)
Test mode: Skipping sync for roxyzim@gmail.com (not in test list)
Test mode: Skipping sync for megan@simplybeingmeg.co.za (not in test list)
Test mode: Skipping sync for ahumphrer@gmail.com (not in test list)
Test mode: Skipping sync for heikeh@hardingham.co.za (not in test list)
```

## Root Cause

Line 11 in `supabase/functions/sync-invoice-to-io/index.ts`:
```javascript
const TEST_MODE = true;  // <-- THIS IS THE PROBLEM
```

## Fix Required

Change line 11 from:
```javascript
const TEST_MODE = true;
```

To:
```javascript
const TEST_MODE = false;
```

## Files to Modify

| File | Change |
|------|--------|
| `supabase/functions/sync-invoice-to-io/index.ts` | Change `TEST_MODE = true` to `TEST_MODE = false` on line 11 |

## Post-Fix: Re-sync Failed Invoices

After deploying the fix, Ady will need to re-send the 10 invoices that failed to sync:
1. For each invoice, click the "..." menu and select "Email Invoice" again
2. This will trigger the IO sync and email workflow

The invoices themselves are fine - they just need to be re-synced to IO now that test mode is disabled.

## Deployment
After the code change, the edge function will be redeployed automatically.

