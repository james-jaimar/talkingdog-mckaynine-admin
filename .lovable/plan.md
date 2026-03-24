

# Fix: Changing Franchise Month Doesn't Update Term

## Problem

When Ady changes an invoice's franchise billing month (e.g. from March → April), only `franchise_report_month` is updated in the database. The `term_id` remains unchanged (still Term 1). Since the Invoices page filters by `term_id`, the invoice stays visible under Term 1 instead of moving to Term 2.

## Root Cause

`handleAllocateToMonth` in `InvoicesTable.tsx` (line 172-175) only updates `franchise_report_month`. It never touches `term_id`.

Same issue exists in `MissingMonthAllocationWarning.tsx` (line 41-44).

## Solution

Create a database function `get_term_id_for_month(month_str text)` that maps a `YYYY-MM` string to the correct `term_id`. Then update both places that change `franchise_report_month` to also set `term_id`.

### File 1: New migration

```sql
-- Function to resolve term_id from a YYYY-MM franchise month string
CREATE OR REPLACE FUNCTION public.get_term_id_for_month(month_str text)
RETURNS uuid
LANGUAGE plpgsql STABLE
SET search_path = public
AS $$
DECLARE
  month_date date;
  result_id uuid;
BEGIN
  month_date := (month_str || '-01')::date;
  
  SELECT t.id INTO result_id
  FROM public.terms t
  JOIN public.academic_years ay ON ay.id = t.academic_year_id
  WHERE month_date BETWEEN t.start_date AND t.end_date
  LIMIT 1;
  
  RETURN result_id;
END;
$$;
```

### File 2: `src/components/invoices/table/InvoicesTable.tsx`

Update `handleAllocateToMonth` (~line 172-175) to also set `term_id`:

```typescript
// Resolve term_id from the franchise month
let termId = null;
if (franchiseMonth) {
  const { data } = await supabase.rpc('get_term_id_for_month', { month_str: franchiseMonth });
  termId = data;
}

const { error } = await supabase
  .from('invoices')
  .update({ 
    franchise_report_month: franchiseMonth,
    ...(termId ? { term_id: termId } : {})
  })
  .in('id', Array.from(selectedIds));
```

### File 3: `src/components/invoices/summary/MissingMonthAllocationWarning.tsx`

Same pattern — when auto-allocating unallocated invoices (~line 41-44), also resolve and set `term_id`.

### File 4: Data fix for Sophie's invoice

```sql
UPDATE invoices 
SET term_id = (SELECT id FROM terms t 
               JOIN academic_years ay ON ay.id = t.academic_year_id 
               WHERE t.term_number = 2 AND ay.year = 2026)
WHERE id = '9175d1fb-f4f0-434e-8d2b-11e7fbf0e607';
```

## Files Changed
1. New migration — `get_term_id_for_month` function + Sophie data fix
2. `src/components/invoices/table/InvoicesTable.tsx` — update `handleAllocateToMonth`
3. `src/components/invoices/summary/MissingMonthAllocationWarning.tsx` — update auto-allocation

