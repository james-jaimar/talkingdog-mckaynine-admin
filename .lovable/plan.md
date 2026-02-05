
# Fix Financial Report to Use Franchise Report Month

## Problem

The Class Financial Report shows blank for February because it filters by `issued_date` instead of `franchise_report_month`.

**Current behavior:**
- Report for February filters: `issued_date >= '2026-02-01'`
- Puppy Feb invoices have: `issued_date = '2026-01-29'` (excluded!)
- But they have: `franchise_report_month = '2026-02'` (should be included)

**Expected behavior:**
- Report should filter by `franchise_report_month` to respect the override

---

## Solution

Update the financial query to filter by `franchise_report_month` instead of `issued_date` when date filters are provided.

---

## Technical Changes

### File: `src/hooks/financial/useFinancialQuery.ts`

Change the date filtering logic from:

```typescript
// Current - filters by issued_date
if (fromDate) {
  invoicesQuery = invoicesQuery.gte('issued_date', fromDate);
}
if (toDate) {
  invoicesQuery = invoicesQuery.lte('issued_date', toDate);
}
```

To:

```typescript
// New - filter by franchise_report_month for monthly reports
if (fromDate && toDate) {
  // Extract YYYY-MM from the date range for franchise_report_month filtering
  const fromMonth = fromDate.substring(0, 7); // e.g., "2026-02"
  invoicesQuery = invoicesQuery.eq('franchise_report_month', fromMonth);
} else if (fromDate) {
  // Fallback to issued_date if only partial range
  invoicesQuery = invoicesQuery.gte('issued_date', fromDate);
}
if (toDate && !fromDate) {
  invoicesQuery = invoicesQuery.lte('issued_date', toDate);
}
```

Since the ClassFinancialReport uses month selectors (both from and to are always set for a single month), this will correctly filter by the franchise report month.

---

## Alternative: Dual Filtering Support

If other parts of the app need `issued_date` filtering while financial reports need `franchise_report_month`, we could add a parameter to specify the filter type. However, since the financial report is specifically for franchise reporting periods, using `franchise_report_month` is the correct approach.

---

## Expected Outcome

After this fix:
1. Selecting "February 2026" in the report will show all invoices with `franchise_report_month = '2026-02'`
2. The Puppy Feb class invoices (issued Jan 29th but tagged for February) will appear correctly
3. The class-level `report_month_override` feature will work as intended

---

## Files to Modify

| File | Change |
|------|--------|
| `src/hooks/financial/useFinancialQuery.ts` | Filter by `franchise_report_month` instead of `issued_date` |
