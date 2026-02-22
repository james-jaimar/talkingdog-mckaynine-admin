

# Fix: IO Inventory Code Not Showing in Edit Modal

## Root Cause

The `io_inventory_code` is saved to the database correctly when you update a class, but it is **not fetched back** when classes are loaded. The Supabase `.select()` queries in `useClassQuery.ts` list every column explicitly but omit `io_inventory_code`. So when you reopen the edit modal, the field is always blank.

Additionally, the `ClassWithSchedules` TypeScript interface is missing the `io_inventory_code` property, which means even if the data were fetched, TypeScript would not recognize it (the form-defaults file works around this with `(classData as any).io_inventory_code`).

## Changes

### 1. Add `io_inventory_code` to the `ClassWithSchedules` interface
**File:** `src/components/classes/hooks/types/class-with-schedules.ts`
- Add `io_inventory_code?: string | null;` (matching the `Class` interface)

### 2. Add `io_inventory_code` to both SELECT queries
**File:** `src/components/classes/hooks/class-ordering/useClassQuery.ts`
- Add `io_inventory_code` to the first select list (around line 64, after `report_month_override`)
- Add `io_inventory_code` to the second select list (around line 99, after `report_month_override`)

### 3. Remove the `as any` cast in form-defaults
**File:** `src/components/classes/hooks/utils/form-defaults.ts`
- Change `(classData as any).io_inventory_code` to `classData.io_inventory_code` since the type will now include the property

That is the complete fix -- three small, targeted changes. The submission/save side is already working correctly.

