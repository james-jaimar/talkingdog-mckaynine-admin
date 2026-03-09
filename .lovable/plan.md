

## Problem

Invoices for Term 2 classes are showing under Term 1 because the Invoices page filters by `issued_date` within the term's calendar quarter (Term 1 = Jan-Mar, Term 2 = Apr-Jun). A Term 2 class that starts in March will have an invoice with a March `issued_date`, placing it in Term 1's view.

## Solution

Add a `term_id` column to the `invoices` table so invoices are explicitly linked to their class's term. When filtering by term, use `term_id` instead of date range.

### Database Change

Add `term_id` (nullable UUID, FK to `terms`) to the `invoices` table. Nullable because custom invoices may not be class-linked.

### Invoice Creation — Pass `term_id` Through

The invoice creation chain already passes `classBranchId` and `classReportMonthOverride` from the class schedule. We add `classTermId` the same way:

| File | Change |
|---|---|
| `createInvoiceForHandler.ts` | Add `classTermId?: string` to `CreateInvoiceProps`. Pass it into invoice data as `term_id` |
| `createInvoiceUtils.ts` | Include `term_id` in `insertData` |
| `addHandlerToClass.ts` | Already extracts `termId` from schedule info — pass it as `classTermId` |
| `BookingToInvoiceProvider.tsx` | Look up booking's class_schedule term_id, pass to invoice creation |

### Invoice Types

Add `term_id?: string | null` to the `Invoice` interface in `src/hooks/invoices/types.ts`.

### Invoices Page Filtering

In `src/pages/Invoices.tsx`, when `monthFilter === "term"`, filter by `invoice.term_id === termData.id` instead of date range. Fall back to date range for invoices without a `term_id`.

### Backfill Existing Invoices

Run a one-time SQL update to set `term_id` on existing invoices by joining through `invoice_items` → `bookings` → `class_schedules`:

```sql
UPDATE invoices i
SET term_id = cs.term_id
FROM invoice_items ii
JOIN bookings b ON b.id = ii.booking_id
JOIN class_schedules cs ON cs.id = b.class_schedule_id
WHERE ii.invoice_id = i.id
  AND i.term_id IS NULL
  AND cs.term_id IS NOT NULL;
```

### Files to modify

1. **Migration SQL** — add `term_id` column + backfill
2. `src/hooks/invoices/types.ts` — add `term_id` to Invoice interface
3. `src/components/classes/handlers/hooks/add-handler-modal/createInvoiceForHandler.ts` — accept and pass `classTermId`
4. `src/lib/invoices/createInvoiceUtils.ts` — include `term_id` in insert
5. `src/components/classes/handlers/hooks/add-handler-modal/addHandlerToClass.ts` — pass `termId` as `classTermId`
6. `src/pages/Invoices.tsx` — filter by `term_id` when term filter active
7. `src/components/invoices/booking-components/BookingToInvoiceProvider.tsx` — look up term_id from booking's schedule
8. `src/components/financial/FinancialDashboardContent.tsx` — use `term_id` for term filtering
9. `src/pages/FinancialDashboard.tsx` — use `term_id` for term filtering

