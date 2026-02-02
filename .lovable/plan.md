

# Starter Kit Inventory Management System (Updated)

## Overview

Create a simple stock tracking system for enrollment fees/starter kits (bait bags). This allows Adie to:
1. Record when she purchases kits in bulk from Shannon (incoming stock)
2. Automatically deduct stock when handlers are enrolled in classes with enrollment fees
3. See current stock levels at a glance

## Key Change: App-Level Stock

Stock is managed at the **app level** (not per-branch). Adie maintains one pool of starter kits, and either Randburg or Delta can draw from it. The allocation records will still track which branch used the kit for reporting purposes.

---

## Database Design

### New Table: `starter_kit_inventory`

| Column | Type | Description |
|--------|------|-------------|
| id | uuid | Primary key |
| quantity_added | integer | Number of kits purchased |
| quantity_remaining | integer | Current available stock from this batch |
| purchase_date | date | When kits were purchased |
| unit_cost | numeric | Cost per kit (optional, for reporting) |
| notes | text | Optional notes (e.g., "From Shannon - Feb batch") |
| created_at | timestamp | Record creation time |
| updated_at | timestamp | Last modification time |

No branch_id - stock is global/app-level.

### New Table: `starter_kit_allocations`

| Column | Type | Description |
|--------|------|-------------|
| id | uuid | Primary key |
| inventory_batch_id | uuid | FK to starter_kit_inventory (which batch this came from) |
| branch_id | uuid | FK to branches (which branch used this kit - for reporting) |
| invoice_item_id | uuid | FK to invoice_items (which enrollment fee triggered this) |
| handler_id | uuid | FK to clients |
| dog_name | text | Which dog received the kit |
| allocated_at | timestamp | When kit was allocated |

Branch tracked on allocation for reporting (e.g., "Delta used 8 kits this month").

---

## User Interface

### Financial Reports - New "Starter Kits" Tab

```text
+-----------------------------------------------------------------------------------+
| Starter Kit Inventory                                            [+ Add Stock]   |
+-----------------------------------------------------------------------------------+

+-----------------------------------------------------------------------------------+
| Stock Overview                                                                    |
+-----------------------------------------------------------------------------------+
|  [  24  ]     Total kits in stock                                                 |
|  [  18  ]     Allocated this month                                                |
|  [  ⚠️  ]     Low stock warning (if < 5)                                          |
+-----------------------------------------------------------------------------------+

+-----------------------------------------------------------------------------------+
| Stock Batches                                                                     |
+-----------------------------------------------------------------------------------+
| Date       | Added | Remaining | Notes                    | Actions              |
|------------|-------|-----------|--------------------------|----------------------|
| 01 Feb 26  | 25    | 24        | From Shannon - Feb batch | Edit | Delete        |
| 15 Jan 26  | 20    | 0         | From Shannon - Jan batch | (depleted)           |
+-----------------------------------------------------------------------------------+

+-----------------------------------------------------------------------------------+
| Recent Allocations                                                                |
+-----------------------------------------------------------------------------------+
| Date       | Handler           | Dog        | Branch    | Class                  |
|------------|-------------------|------------|-----------|------------------------|
| 28 Jan 26  | John Smith        | Max        | Randburg  | Puppy Training T1-2026 |
| 25 Jan 26  | Sarah Jones       | Bella      | Delta     | EO Class T1-2026       |
+-----------------------------------------------------------------------------------+
```

### Add Stock Modal

- Quantity field (number input)
- Purchase date (date picker, defaults to today)
- Unit cost (optional, for tracking)
- Notes (optional text field)
- Save button

---

## Automatic Deduction Logic

When an enrollment fee invoice item is created:
1. Find the oldest batch with remaining stock (FIFO - First In, First Out)
2. Decrement `quantity_remaining` by 1
3. Create an allocation record with branch_id from the invoice

Triggers in:
- `createInvoiceForHandler.ts` - when item_type is 'enrollment_fee'
- `addToExistingInvoice.ts` - when enrollment fee is added
- Customer self-enrollment flows

If no stock available: Show warning toast but don't block the enrollment.

---

## Implementation Steps

### Phase 1: Database Setup
1. Create `starter_kit_inventory` table (no branch_id)
2. Create `starter_kit_allocations` table (with branch_id for reporting)
3. Add RLS policies (admin-only access)
4. Create database function `allocate_starter_kit(invoice_item_id, handler_id, dog_name, branch_id)`:
   - Finds oldest batch with stock > 0
   - Decrements quantity_remaining
   - Creates allocation record
   - Returns remaining total stock (for low-stock warnings)

### Phase 2: UI Components
1. Create `StarterKitsReport.tsx` component
2. Create `AddStockModal.tsx` for adding new batches
3. Create `useStarterKitInventory.ts` hook for data fetching
4. Add "Starter Kits" tab to `FinancialReports.tsx`

### Phase 3: Automatic Allocation
1. Modify `createInvoiceForHandler.ts` to call allocation after enrollment fee item
2. Modify `addToExistingInvoice.ts` similarly
3. Add toast notification if stock is low (< 5 remaining)

---

## Files to Create

| File | Purpose |
|------|---------|
| `src/components/invoices/reports/StarterKitsReport.tsx` | Main tab component |
| `src/components/invoices/reports/AddStockModal.tsx` | Modal for adding stock |
| `src/hooks/useStarterKitInventory.ts` | Data fetching hook |

## Files to Modify

| File | Change |
|------|--------|
| `src/pages/FinancialReports.tsx` | Add Starter Kits tab |
| `src/components/classes/handlers/hooks/add-handler-modal/createInvoiceForHandler.ts` | Call allocation function |
| `src/components/classes/handlers/hooks/add-handler-modal/addToExistingInvoice.ts` | Call allocation function |

---

## Summary

- Single global stock pool (app-level, not per-branch)
- FIFO allocation from oldest batches first
- Allocations track which branch used the kit
- Automatic deduction when enrollment fees are invoiced
- Low stock warnings when < 5 kits remain
- Simple UI in Financial Reports tab

