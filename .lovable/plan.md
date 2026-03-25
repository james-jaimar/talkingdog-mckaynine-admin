

# Fix: Invoice Term Not Syncing When Franchise Month Changes

## Problem

Sophie's invoice (INV-McR-2603-0007) has `franchise_report_month = '2026-04'` but `term_id` still points to Term 1 (`af8f86a4`). The expected term is Term 2 (`c7951cbb`).

**66 invoices** have this mismatch across the system (65 historical Delta, 1 Randburg).

## Root Cause

There is **no database trigger** on the `invoices` table to automatically sync `term_id` when `franchise_report_month` changes. The frontend code we added earlier (calling `get_term_id_for_month` RPC in `InvoicesTable.tsx` and `MissingMonthAllocationWarning.tsx`) only covers 2 of many paths that can update invoices. Direct SQL updates, edge functions, the rebalance logic, and other code paths all bypass this.

The `get_term_id_for_month` function already exists and works correctly -- it just needs to be called automatically by the database.

## Solution

### 1. Database Migration: Add trigger + backfill

Create a `BEFORE INSERT OR UPDATE` trigger on `invoices` that automatically sets `term_id` from `franchise_report_month` whenever the month changes:

```sql
CREATE OR REPLACE FUNCTION public.sync_invoice_term_from_month()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  resolved_term_id uuid;
BEGIN
  -- Only act when franchise_report_month is set and has changed
  IF NEW.franchise_report_month IS NOT NULL 
     AND (TG_OP = 'INSERT' OR OLD.franchise_report_month IS DISTINCT FROM NEW.franchise_report_month) THEN
    
    resolved_term_id := public.get_term_id_for_month(NEW.franchise_report_month);
    
    IF resolved_term_id IS NOT NULL THEN
      NEW.term_id := resolved_term_id;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_sync_invoice_term
  BEFORE INSERT OR UPDATE ON public.invoices
  FOR EACH ROW
  EXECUTE FUNCTION public.sync_invoice_term_from_month();
```

Then backfill current-year (2026+) mismatches:

```sql
UPDATE public.invoices
SET term_id = public.get_term_id_for_month(franchise_report_month)
WHERE franchise_report_month IS NOT NULL
  AND franchise_report_month >= '2026-01'
  AND public.get_term_id_for_month(franchise_report_month) IS DISTINCT FROM term_id;
```

### 2. Simplify frontend code

Remove the now-redundant `get_term_id_for_month` RPC calls from:
- `src/components/invoices/table/InvoicesTable.tsx` (lines 172-177) -- just update `franchise_report_month`; trigger handles `term_id`
- `src/components/invoices/summary/MissingMonthAllocationWarning.tsx` (lines 42-46) -- same simplification

The update calls become simply:
```typescript
const { error } = await supabase
  .from('invoices')
  .update({ franchise_report_month: franchiseMonth })
  .in('id', invoiceIds);
```

## Impact

- Sophie's invoice (and any future changes) will automatically move to the correct term
- All code paths (UI, edge functions, direct SQL) are covered
- Frontend code becomes simpler and less error-prone
- Historical Delta data left untouched per your preference

## Files Changed
1. New migration: trigger function + trigger + 2026 backfill
2. `src/components/invoices/table/InvoicesTable.tsx` -- remove RPC call
3. `src/components/invoices/summary/MissingMonthAllocationWarning.tsx` -- remove RPC call

