

## Add CRUD for Bookkeeping Categories

### What it does
Adds a management UI for bookkeeping transaction categories (the filter badges like "Supplies", "Equipment", etc.) so Ady can create, edit, reorder, and delete categories without needing database access.

### Where it lives
A new "Categories" tab will be added inside the Bookkeeping card (alongside Expenses, Other Income, and Summary). This keeps category management close to where categories are used.

### Features
- View all categories grouped by type (expense / income / both)
- Add new category with name, type (expense/income/both), and sort order
- Edit existing category name, type, and sort order
- Toggle category active/inactive (soft delete)
- Delete category entirely (only if no transactions reference it)

### Technical Details

**1. New component: `src/components/financial/CategoryManager.tsx`**
- Fetches all categories (not filtered by active) using a new query variant
- Displays a table with columns: Name, Type, Sort Order, Active, Actions
- Add/Edit via a dialog with fields: name (text), type (select: expense/income/both), sort_order (number)
- Delete button with confirmation -- checks if category is in use first
- Toggle active/inactive via a switch

**2. Update `src/hooks/useBusinessTransactions.ts`**
- Add `useAllTransactionCategories()` query (without `is_active` filter) for the admin view
- Add category CRUD mutations: `useCategoryMutations()` with create, update, delete operations

**3. Update `src/components/financial/BookkeepingTab.tsx`**
- Add a "Categories" tab trigger next to Expenses/Other Income/Summary
- Render `CategoryManager` in the new tab content

**4. New component: `src/components/financial/CategoryDialog.tsx`**
- Form dialog for creating/editing a category
- Fields: name (required), type (select), sort_order (number)

### Files to create
- `src/components/financial/CategoryManager.tsx`
- `src/components/financial/CategoryDialog.tsx`

### Files to modify
- `src/hooks/useBusinessTransactions.ts` -- add admin category queries and mutations
- `src/components/financial/BookkeepingTab.tsx` -- add Categories tab

### No database changes needed
The `business_transaction_categories` table already has all needed columns (id, name, type, is_active, sort_order). RLS policies already allow admin full CRUD.

