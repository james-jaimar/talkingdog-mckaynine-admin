

# Fix: Randburg Payment PDFs Fail — Wrong Business ID

## Root Cause

Line 20 of `sync-invoice-to-io/index.ts`:
```
const IO_BUSINESS_ID_RANDBURG = "8978"; // TODO: Update with actual Randburg business ID when known
```

The Randburg IO business ID is actually **8984**, not 8978. The code still has the Delta ID as a placeholder with a TODO comment.

This matters because:
- **Invoice URLs** work fine — IO returns them directly, and they correctly contain `bid=8984`
- **Payment URLs** are broken — we **construct them ourselves** using `getIOBusinessId()`, which returns `8978` for Randburg

Proof from the database:
- Francoise Harrison invoice URL: `bid=8984` (correct, IO-generated) → works
- Francoise Harrison payment URL: `bid=8978` (wrong, we built it) → "We could not find the file"
- Same payment URL with `bid=8984` → returns the actual receipt

This affects ALL 21 Randburg payment URLs in the database. It has been broken since Randburg was added — previous Randburg receipt emails were sent with corrupted "We could not find the file" HTML as the PDF attachment (confirmed: `V2UgY291bGQg` base64 prefix = "We could..." on 4 historic Randburg receipts).

## Fix

### File 1: `supabase/functions/sync-invoice-to-io/index.ts`
Line 20: Change `"8978"` to `"8984"`

### Database: Fix existing corrupted payment URLs
Update all 21 Randburg invoices to replace `bid=8978` with `bid=8984` in their `io_payment_url`.

### Redeploy edge function

## Impact
- Fixes all future Randburg payment receipt PDF fetches
- Fixes existing 21 corrupted Randburg payment URLs
- No effect on Delta (Delta's business ID is correctly 8978)

**1 line changed + 1 data fix + redeploy**

