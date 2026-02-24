

# Business Bookkeeping: Expenses and Other Income Tracking

## Overview

Ady wants to track all business expenses (supplies, maintenance, gifts, charges) and non-class income (liver bread sales, chew sales, etc.) alongside the existing class revenue. This turns the Financial hub into a full bookkeeping system.

## Where It Lives

A new **"Bookkeeping"** tab in the Financial Reports page (`/financial-reports`). This keeps everything consolidated in the existing Financial hub that Ady already knows. The tab will have two sub-views: **Expenses** and **Other Income**, toggled via a simple inner tab strip.

## Data Model

### New Table: `business_transactions`

A single table for both expenses and income, distinguished by a `type` column. This is cleaner than two separate tables and allows unified reporting.

```text
business_transactions
  id                  uuid (PK, default gen_random_uuid())
  branch_id           uuid (FK -> branches, NOT NULL)
  type                text (NOT NULL) -- 'expense' or 'income'
  date                date (NOT NULL)
  description         text (NOT NULL)
  amount              numeric (NOT NULL)
  category            text (NOT NULL) -- e.g. 'Supplies', 'Maintenance', 'Yoco Charges', 'Sales', 'Gifts'
  vendor_or_source    text -- e.g. 'Checkers', 'Woolworths', 'Sasol'
  payment_method      text -- 'Cash', 'Card', 'EFT'
  reference           text -- receipt number, etc.
  notes               text
  receipt_url         text -- optional uploaded receipt image
  created_by          uuid (FK -> auth.users)
  created_at          timestamptz (default now())
  updated_at          timestamptz (default now())
```

RLS: Admin-only full access, matching the existing pattern.

### New Table: `business_transaction_categories`

Pre-populated categories that Ady can manage. Seeds from the data provided.

```text
business_transaction_categories
  id          uuid (PK, default gen_random_uuid())
  name        text (NOT NULL, UNIQUE)
  type        text (NOT NULL) -- 'expense', 'income', or 'both'
  is_active   boolean (default true)
  sort_order  integer (default 0)
  created_at  timestamptz (default now())
```

Seeded categories from Ady's data:
- **Expense**: Supplies (liver bread ingredients, bags), Equipment, Maintenance (gardener, fuel, creosote), Medical, Processing Fees (Yoco), Gifts, Meals/Entertainment
- **Income**: Product Sales (liver bread, chews), Other Income

## UI Design

### Bookkeeping Tab Layout

```text
+------------------------------------------------------------------+
| [Expenses]  [Other Income]  [Summary]                            |
|                                                                  |
| Date Range: [Month/Year selector]    [+ Add Expense]  [Export]   |
|                                                                  |
| Category Filters: [All] [Supplies] [Equipment] [Maintenance]... |
|                                                                  |
| +------+-------------+-------------------+----------+---------+  |
| | Date | Vendor      | Description       | Category | Amount  |  |
| +------+-------------+-------------------+----------+---------+  |
| | ...  | ...         | ...               | ...      | ...     |  |
| +------+-------------+-------------------+----------+---------+  |
|                                          Total:      | R X,XXX |  |
+------------------------------------------------------------------+
```

### Add/Edit Transaction Dialog

A clean form matching the app's existing dialog patterns:
- Date (date picker)
- Description (text, required)
- Amount (number, required)
- Category (select from pre-defined list)
- Vendor/Source (text with autocomplete from previous entries)
- Payment Method (select: Cash, Card, EFT)
- Reference (text, optional)
- Notes (textarea, optional)
- Receipt Upload (optional file upload to `payment-documents` bucket)

### Summary Sub-Tab

Monthly totals by category, with a simple bar chart showing expense breakdown. Shows:
- Total Expenses for the period
- Total Other Income for the period
- Net (Other Income minus Expenses)
- Category-by-category breakdown

### Branch Filtering

All transactions are branch-specific. The existing branch selector in the header controls which branch's data is shown, consistent with the rest of the app.

## New Files

| File | Purpose |
|------|---------|
| `src/hooks/useBusinessTransactions.ts` | Hook to fetch, create, update, delete transactions with branch + date filtering |
| `src/components/financial/BookkeepingTab.tsx` | Main tab component with inner Expenses/Income/Summary tabs |
| `src/components/financial/TransactionTable.tsx` | Sortable, filterable table of transactions |
| `src/components/financial/TransactionDialog.tsx` | Add/edit transaction dialog |
| `src/components/financial/BookkeepingSummary.tsx` | Monthly summary with category breakdown and chart |

## Modified Files

| File | Change |
|------|--------|
| `src/pages/FinancialReports.tsx` | Add "Bookkeeping" tab trigger and content |

## CSV Import (Bonus)

Since Ady has historical data in spreadsheets, the TransactionDialog will include a "Bulk Import" option that accepts a simple CSV (Date, Description, Amount, Category) using the existing `papaparse` dependency already installed. This lets her bring in her historical records without manual entry.

## Implementation Steps

1. Create `business_transactions` and `business_transaction_categories` tables with RLS and seed data
2. Build the `useBusinessTransactions` hook (CRUD + filtering)
3. Build `TransactionDialog` (add/edit form)
4. Build `TransactionTable` (list view with sorting and category filters)
5. Build `BookkeepingSummary` (aggregated view with chart)
6. Build `BookkeepingTab` (container with inner tabs)
7. Wire into `FinancialReports.tsx`

