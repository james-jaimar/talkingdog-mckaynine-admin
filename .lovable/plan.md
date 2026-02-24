

# Admin Fee Payments Tracking

## Overview

Ady currently pays herself the admin fee as a separate income line item each month. The system already calculates admin fees per class but has no way to record when those fees have actually been "paid out" (withdrawn). We'll add this capability following the same pattern as the existing franchise payment tracking.

## Where It Lives

A new **"Admin Payments"** tab in the Financial Reports page, sitting alongside the existing Franchise Report and Trainers tabs. This keeps all payment tracking in one place and follows the same month/year selector pattern Ady is already familiar with.

## How It Works

1. Ady selects a month and year (same selector pattern as Franchise Report)
2. The system shows the calculated admin fees for that month, broken down by class
3. A summary card shows: Total Admin Fees Due, Amount Paid, Status (Pending/Partial/Paid)
4. Ady can click "Record Payment" to mark the admin fees as paid, with fields for:
   - Amount paid
   - Payment date
   - Payment method (EFT, Cash, etc.)
   - Reference number
   - Notes

## Technical Detail

### Database: New `admin_payments` table

Mirrors the `franchise_payments` pattern:

```text
admin_payments
  id              uuid (PK, default gen_random_uuid())
  branch_id       uuid (FK -> branches, NOT NULL)
  month           integer (NOT NULL, 1-12)
  year            integer (NOT NULL)
  total_admin_fees numeric (NOT NULL, default 0)
  amount_paid     numeric (NOT NULL, default 0)
  status          text (NOT NULL, default 'pending')  -- pending/partial/paid
  payment_date    timestamptz
  payment_method  text
  payment_reference text
  notes           text
  created_at      timestamptz (default now())
  updated_at      timestamptz (default now())
  UNIQUE(branch_id, month, year)
```

RLS: Admin-only full access (same as `franchise_payments`).

### New Files

| File | Purpose |
|------|---------|
| `src/hooks/useAdminPayments.ts` | Hook to fetch admin fee data for a month + upsert payment records (mirrors `useFranchiseMonthlyData` pattern) |
| `src/components/invoices/reports/AdminPaymentsTab.tsx` | Main tab component with month/year selector and class breakdown table |
| `src/components/invoices/reports/AdminPaymentDialog.tsx` | Dialog to record/edit payment (amount, date, method, reference, notes) |

### Modified Files

| File | Change |
|------|--------|
| `src/pages/FinancialReports.tsx` | Add "Admin Payments" tab trigger + content |

### Data Source

The admin fee amounts come from the same `useClassFinancialData` / financial query pipeline already used by the Financial Dashboard. The hook will:
1. Fetch invoices for the selected month (using `franchise_report_month` with `issued_date` fallback -- same as franchise report)
2. Calculate admin fees per class using the class's `admin_fee_type` and `admin_fee_value`
3. Look up the `admin_payments` record for that branch/month/year to show payment status

### UI Layout

The tab will show:
- Month/year selector (top, same pattern as Franchise Report)
- Summary card: Total Admin Fees | Amount Paid | Balance | Status badge
- Table: Class Name | Revenue | Admin Fee % or Amount | Admin Fee Total
- Footer row with totals
- "Record Payment" button that opens the payment dialog

