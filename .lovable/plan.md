

# Fix: Sophie's Invoice Still in Term 1

## Problem

Invoice `INV-McR-2603-0007` has `franchise_report_month = '2026-04'` but `term_id` still points to Term 1. The franchise month was changed before our term-sync fix was deployed, so the term_id was never updated.

## Fix

### Database update (1 row)

Update Sophie's invoice to set `term_id` to Term 2 (`c7951cbb-de96-47b1-bf05-69b512b7f5da`):

```sql
UPDATE invoices 
SET term_id = 'c7951cbb-de96-47b1-bf05-69b512b7f5da'
WHERE id = '177844cb-8385-460e-96d0-46bdc2657316';
```

No code changes needed — the fix we deployed earlier will handle future month changes correctly. This is just a data correction for the one invoice that was changed before the fix went live.

