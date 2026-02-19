
# Fix Franchise Report Balance Display After Payment

## Root Cause

The data is saved correctly to the database (`status: paid`, `amount_paid` matches `total_due`). The bug is purely a **display issue** in `FranchiseClassesReport.tsx`.

The three summary metric cards always show raw calculated totals from invoices:
- Course Fees
- Franchise Fees
- Total Due → always shows full `reportTotals.totalAmount`, never reduced by `amountPaid`

There is no "Balance" or "Amount Paid" card, and the payment status badge is the only indicator that payment was recorded — but the numbers themselves never update to reflect it.

## What Changes

### File: `src/components/invoices/reports/FranchiseClassesReport.tsx`

Replace the 3-column summary grid with a smarter 4-column layout that accounts for payment status:

**When no payment recorded (pending):**
- Course Fees | Franchise Fees | Total Due | Balance Outstanding (= Total Due, shown in amber)

**When partially paid:**
- Course Fees | Franchise Fees | Total Due | Amount Paid + Balance Outstanding (shown in blue/amber)

**When fully paid:**
- Course Fees | Franchise Fees | Total Due | ✓ Paid in Full (green, shows amount paid, balance = R0)

### Specifically

1. **Add a 4th summary card** for payment status that shows:
   - Amount paid (if any)
   - Balance remaining = `totalAmount - amountPaid`
   - Color-coded: green (paid), blue (partial), amber (pending/unpaid)

2. **When status is `paid`**: show the balance as R 0.00 in green with a checkmark.

3. **When status is `partial`**: show both amount paid and remaining balance.

4. **When no payment**: show full amount as outstanding in amber.

### No backend changes needed — the data is already correct in the database.

## Technical Details

In `FranchiseClassesReport.tsx` (lines 211–232), replace the 3-card grid:

```tsx
// Current: 3 cards, no payment awareness
<div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
  ...Course Fees...
  ...Franchise Fees...
  ...Total Due (always full amount)...
</div>
```

With a 4-card grid:

```tsx
// New: 4 cards, 4th reflects payment status
const totalDue = franchiseData.reportTotals.totalAmount;
const amountPaid = franchiseData.paymentStatus?.amountPaid || 0;
const balance = Math.max(0, totalDue - amountPaid);
const isPaid = franchiseData.paymentStatus?.status === 'paid';
const isPartial = franchiseData.paymentStatus?.status === 'partial';

// 4th card:
// - If paid: "Paid in Full" green card, R 0.00 balance
// - If partial: "Balance Outstanding" blue card with paid/remaining split
// - If none: "Balance Outstanding" amber card showing full amount
```

Also update the grid from `md:grid-cols-3` to `md:grid-cols-4` (or `md:grid-cols-2 lg:grid-cols-4`) for responsive layout.
