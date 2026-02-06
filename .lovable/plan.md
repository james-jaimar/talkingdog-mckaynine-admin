

# Fix Missing Franchise Report Month and Add Validation

## Problem Summary

Invoice `INV-McR-2601-0009` (Beryl Kolb, Tricks class, R1,770.00) has `franchise_report_month` set to NULL, causing it to be excluded from the January 2026 financial report. This resulted in a franchise fee discrepancy:
- **Expected**: R2,614.13 (10 invoices)
- **Actual**: R2,348.63 (9 invoices)
- **Difference**: R265.50 (exactly 15% of R1,770.00)

---

## Part 1: Fix the Beryl Kolb Invoice (Data Fix)

### Action Required
Update the invoice in the database to set the correct `franchise_report_month`:

```sql
UPDATE invoices 
SET franchise_report_month = '2026-01'
WHERE id = '0fbe1a5b-ffbd-461d-b382-e20c50452c05';
```

**Invoice Details:**
- Invoice Number: `INV-McR-2601-0009`
- Invoice ID: `0fbe1a5b-ffbd-461d-b382-e20c50452c05`
- Issued Date: 2026-01-08
- Total: R1,770.00

---

## Part 2: Add Missing Month Allocation Warning

Create a warning banner on the Invoices page that alerts users when invoices are missing `franchise_report_month`. This prevents invoices from silently falling through the cracks in financial reports.

### New Component: `MissingMonthAllocationWarning.tsx`

**Location:** `src/components/invoices/summary/MissingMonthAllocationWarning.tsx`

**Features:**
- Checks all invoices for NULL `franchise_report_month` values
- Displays a prominent warning banner when issues are found
- Lists affected invoice numbers for easy identification
- Provides a direct link/action to fix the issue

**Visual Design:**
```text
+-----------------------------------------------------------+
|  ⚠️  Unallocated Invoices Found (2 invoices)              |
|                                                           |
|  The following invoices are missing a franchise report    |
|  month and will be excluded from financial reports:       |
|                                                           |
|  • INV-McR-2601-0009 (Beryl Kolb - R1,770.00)            |
|  • INV-McD-2601-0012 (John Smith - R850.00)              |
|                                                           |
|  [Allocate Now]  [Dismiss]                                |
+-----------------------------------------------------------+
```

### Files to Create/Modify

| File | Action | Description |
|------|--------|-------------|
| `src/components/invoices/summary/MissingMonthAllocationWarning.tsx` | **Create** | New warning banner component |
| `src/pages/Invoices.tsx` | **Modify** | Add the warning component above the invoice list |

---

## Technical Details

### MissingMonthAllocationWarning Component

```typescript
interface MissingMonthAllocationWarningProps {
  invoices: Invoice[];
  onAllocateClick?: (invoices: Invoice[]) => void;
}
```

**Logic:**
1. Filter invoices where `franchise_report_month` is null/undefined
2. If count > 0, render warning banner
3. Show invoice numbers, client names, and amounts
4. Provide "Allocate Now" button to open bulk allocation dialog

### Integration in Invoices.tsx

Add the warning component between the header and the filter tabs:

```tsx
<MissingMonthAllocationWarning 
  invoices={invoices}
  onAllocateClick={(unallocatedInvoices) => {
    // Pre-select these invoices and open allocation dialog
  }}
/>
```

---

## Expected Outcome

1. **Immediate Fix**: Beryl Kolb's invoice will appear in the January 2026 report, and franchise fees will correctly show R2,614.13

2. **Future Prevention**: Any invoices with missing `franchise_report_month` values will trigger a visible warning, ensuring financial data integrity

3. **User Experience**: Staff can quickly identify and fix unallocated invoices before generating financial reports

