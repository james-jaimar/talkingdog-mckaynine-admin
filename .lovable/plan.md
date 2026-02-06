
# Fix Delta Invoice Discrepancy and Align Report Logic

## Root Cause Analysis

### What Happened
The discrepancy between the Financial Report (R6,014.63) and Franchise Report (R10,089.76) for Delta in January 2026 is caused by **18 invoices with NULL `franchise_report_month`**.

**Timeline of events:**
1. **Jan 11, 2026**: The `franchise_report_month` column was added to the invoices table
2. **Jan 10-15, 2026**: 18 Delta invoices were created BEFORE the auto-population logic was added to `createInvoiceUtils.ts`
3. These invoices have NULL `franchise_report_month` because:
   - They were created before the code that auto-sets this field existed
   - Or the code was updated after they were created

### The Logic Mismatch

| Report | Filter Logic | Result |
|--------|--------------|--------|
| **Financial Report** (`useFinancialQuery.ts`) | Strict: Only includes invoices where `franchise_report_month = '2026-01'` | 25 invoices |
| **Franchise Report** (`useFranchiseMonthlyData.ts`) | Fallback: Includes invoices with matching `franchise_report_month` OR NULL + issued_date in range | 43 invoices |

### The 18 Missing Invoices (R27,432.50 total)
```
INV-McD-2601-0009 - R600.00
INV-McD-2601-0012 - R600.00
INV-McD-2601-0016 - R600.00
INV-McD-2601-0021 - R1,050.00
INV-McD-2601-0036 - R1,680.00
INV-McD-2601-0037 - R1,680.00
INV-McD-2601-0038 - R1,680.00
INV-McD-2601-0042 - R1,680.00
INV-McD-2601-0043 - R1,327.50
INV-McD-2601-0046 - R2,160.00
INV-McD-2601-0047 - R2,160.00
INV-McD-2601-0048 - R2,160.00
INV-McD-2601-0049 - R1,770.00
INV-McD-2601-0051 - R1,680.00
INV-McD-2601-0052 - R1,680.00
INV-McD-2601-0053 - R1,680.00
INV-McD-2601-0054 - R1,755.00
INV-McD-2601-0055 - R1,490.00
```

---

## Solution Plan

### Part 1: Fix the Data (SQL Migration)

Update all 18 Delta invoices to set `franchise_report_month = '2026-01'`:

```sql
UPDATE invoices 
SET franchise_report_month = '2026-01'
WHERE id IN (
  '5f245ab5-da59-46d2-92a1-626867042d7c',
  'fb700500-232d-4e3a-b201-d224270f75b9',
  'c57090c3-75e8-4e92-ad8a-7e2db3389ec8',
  '82b20076-063e-4416-a5bf-2f911a528240',
  '8118af4f-1ea7-4ec7-9d3a-11de03765df5',
  'fcf7947b-7d1c-476c-8b2e-d48adf64172f',
  '367483c6-a956-4903-a26f-6ff23664948c',
  '7bf38f04-bc40-4902-b5a6-dc49ee3a2456',
  '8d2aca1f-159e-469c-b682-584642cca941',
  '6e25df73-abf8-4066-83c0-7a64483e2715',
  '153bf73b-e3ce-4e71-965b-7288b54a6382',
  'f598b487-be04-4c3c-9b95-8e28a9741d5b',
  'a6cd1292-eebc-41f4-b3fe-66593ade0cdf',
  '297e6bfc-95a7-4e2b-b801-5c71f6579f07',
  '3927386f-9c00-450e-87fe-25c6aef61fcf',
  'fbba140e-faf0-4b4b-b4b3-febd47cdcb83',
  'f5f9538a-3c61-4739-aa95-4905a404f97e',
  '2b0216a3-762c-4172-883f-21da5651ae52'
);
```

### Part 2: Align Report Logic

Update `useFinancialQuery.ts` to use the same fallback logic as `useFranchiseMonthlyData.ts`:

**Current (strict):**
```typescript
invoicesQuery = invoicesQuery.eq('franchise_report_month', fromMonth);
```

**Updated (with fallback):**
```typescript
// Use .or() to include invoices with matching franchise_report_month 
// OR NULL franchise_report_month with issued_date in range
invoicesQuery = invoicesQuery.or(
  `franchise_report_month.eq.${fromMonth},and(franchise_report_month.is.null,issued_date.gte.${fromDate},issued_date.lte.${toDate})`
);
```

### Part 3: Backfill All NULL Invoice Months (Defensive)

Run a one-time migration to auto-populate `franchise_report_month` for ALL invoices where it's currently NULL:

```sql
UPDATE invoices 
SET franchise_report_month = 
  EXTRACT(YEAR FROM issued_date) || '-' || 
  LPAD(EXTRACT(MONTH FROM issued_date)::text, 2, '0')
WHERE franchise_report_month IS NULL;
```

This ensures all historical invoices have a proper allocation.

---

## Files to Modify

| File | Action | Description |
|------|--------|-------------|
| `supabase/migrations/new.sql` | **Create** | SQL to fix the 18 Delta invoices + backfill all NULLs |
| `src/hooks/financial/useFinancialQuery.ts` | **Modify** | Add fallback logic to match Franchise Report |

---

## Expected Outcome

After implementation:
1. **Financial Report** and **Franchise Report** will show identical franchise fee calculations
2. Delta January 2026 will correctly show ~R10,089.76 franchise fee (15% of course fees)
3. The warning banner on the Invoices page will show no unallocated invoices
4. Future invoices will always have `franchise_report_month` set automatically via `createInvoiceUtils.ts`

---

## Prevention Going Forward

The current code in `createInvoiceUtils.ts` already auto-sets `franchise_report_month`:

```typescript
const autoReportMonth = `${issuedDate.getFullYear()}-${String(issuedDate.getMonth() + 1).padStart(2, '0')}`;
const franchiseReportMonth = calculatedData.report_month_override || autoReportMonth;
```

Combined with the `MissingMonthAllocationWarning` component (just implemented), users will be alerted if any invoices slip through without allocation.
