
# Fix IO Integration - Correct Branch IDs

## Problem Identified

The edge function has **incorrect branch IDs** that don't match the actual database values:

| Branch | Current (Wrong) | Correct |
|--------|-----------------|---------|
| Delta | `6351a9e8-77db-46cc-8c54-72be8eb01b65` | `6351a9e8-77db-403b-ab1f-cd47e393a006` |
| Randburg | `284817cf-de0d-4cb1-8e1d-00bb34baf0da` | `284817cf-de0d-43b9-a506-a3efa625ae1c` |

This caused the error: `"No IO credentials configured for this branch"` because the invoice's `branch_id` didn't match either of the hardcoded values.

## Solution

Update lines 14-15 in `supabase/functions/sync-invoice-to-io/index.ts`:

```typescript
// Before (wrong):
const DELTA_BRANCH_ID = "6351a9e8-77db-46cc-8c54-72be8eb01b65";
const RANDBURG_BRANCH_ID = "284817cf-de0d-4cb1-8e1d-00bb34baf0da";

// After (correct):
const DELTA_BRANCH_ID = "6351a9e8-77db-403b-ab1f-cd47e393a006";
const RANDBURG_BRANCH_ID = "284817cf-de0d-43b9-a506-a3efa625ae1c";
```

## Verified Items

The IO invoice data format is correct:
- Product code, quantity, description, unit price, currency, VAT settings are all properly formatted
- Client creation uses correct fields (name, email, phone, address)
- Payment sync uses EFT method and correct date format

## Files to Modify

| File | Change |
|------|--------|
| `supabase/functions/sync-invoice-to-io/index.ts` | Fix branch ID constants on lines 14-15 |

## After Fix

Re-deploy the edge function and create a new test invoice for `jimmybhawkins@gmail.com`. The sync should now work and populate the `io_invoice_url` field.
