

# Fix: Duplicate Invoice Number in Household Rebalance

## The Problem

The `rebalanceHouseholdInvoices.ts` function uses an incorrect method to generate invoice numbers. It counts the number of invoices matching the prefix instead of finding the highest existing number.

### Current Code (Lines 196-202)

```typescript
const { count } = await supabase
  .from('invoices')
  .select('*', { count: 'exact', head: true })
  .like('invoice_number', `${invoicePrefix}%`);

const nextNumber = ((count || 0) + 1).toString().padStart(4, '0');
```

### Why This Fails

Looking at your database:

| Invoice Number | Status | Notes |
|----------------|--------|-------|
| 0015 | sent | |
| 0016 | sent | Suzette Nel |
| 0017 | sent | |
| 0018 | draft | Dean Nolte |
| **0016** | **draft** | **DUPLICATE - Duncan Miller** |

When Duncan's invoice was created:
1. The system counted 16 invoices with prefix `INV-McD-2602-`
2. It calculated: 16 + 1 = 17, but stored as `0016` (off by one in the logic)
3. Actually, the count was 15 at that moment, so it generated 0016 which already existed

There are also gaps in the sequence (0004 missing, 0009 missing, 0013 missing) which confirms the counting approach doesn't work.

## The Fix

Use the same approach as `useInvoiceUtilities.ts` - find the highest invoice number and increment it.

### File: `src/components/classes/handlers/hooks/add-handler-modal/rebalanceHouseholdInvoices.ts`

**Replace lines 186-202 with:**

```typescript
// 6. Create new invoice for the second handler
// Generate invoice number using the same approach as useInvoiceUtilities
const now = new Date();
const yearMonth = `${now.getFullYear().toString().slice(-2)}${(now.getMonth() + 1).toString().padStart(2, '0')}`;

// Determine branch prefix
const branchPrefix = newClassBranchId === '6351a9e8-77db-403b-ab1f-cd47e393a006' ? 'McD' : 'McR';
const invoicePrefix = `INV-${branchPrefix}-${yearMonth}-`;

// Get the LAST invoice number for this prefix (not count!)
const { data: lastInvoice } = await supabase
  .from('invoices')
  .select('invoice_number')
  .ilike('invoice_number', `${invoicePrefix}%`)
  .order('invoice_number', { ascending: false })
  .limit(1);

let nextNumber = 1;
if (lastInvoice && lastInvoice.length > 0) {
  const lastSequence = lastInvoice[0].invoice_number.split('-').pop();
  if (lastSequence) {
    nextNumber = parseInt(lastSequence, 10) + 1;
  }
}

const newInvoiceNumber = `${invoicePrefix}${nextNumber.toString().padStart(4, '0')}`;
```

## Key Changes

| Before | After |
|--------|-------|
| Uses `count` of matching invoices | Finds highest invoice number |
| Prone to duplicates when gaps exist | Increments from actual highest number |
| `order('created_at')` irrelevant | `order('invoice_number', desc)` finds latest |

## Expected Result

After the fix, the next invoice created with prefix `INV-McD-2602-` will correctly be `INV-McD-2602-0019` (since 0018 is currently the highest).

## Manual Data Fix Needed

You should manually update Duncan Miller's duplicate invoice number `INV-McD-2602-0016` to `INV-McD-2602-0019` or delete and recreate it to resolve the existing duplicate.

