

## Fix: Show Historical Class Status Data Even for Inactive Class Types

### Root Cause
The data is intact in `handler_class_status`. The problem is the Handlers table only renders columns for **active** class types. When a class type is toggled inactive for a branch (e.g., Beginner is inactive for Randburg), the column disappears — and with it, all historical completion records.

### Solution
In `useHandlersData.ts`, use **all** class types (including inactive) for rendering the class status columns — not just the active ones. The active/inactive distinction should only control:
- Whether the class type appears in **forms** (Add Class, enrollment dropdowns) — active only
- Whether new classes can be created for that type — active only

The Handlers table should always show columns for any class type that exists, so historical data remains visible.

### Changes

**`src/components/handlers/hooks/useHandlersData.ts`**
- Change `useClassTypes()` call to `useClassTypes(true)` (include inactive) so all class type columns render in the Handlers table

**`src/components/handlers/table/TableHeader.tsx`**
- Already receives `classTypes` as prop — no change needed, just receives the full list now

**`src/components/handlers/table/HandlerTableRow.tsx`**
- Already receives `classTypes` as prop — no change needed

### What Stays Active-Only
- `AddClassForm.tsx` — keep `useClassTypes()` (active only) for class creation dropdown
- `EditClassForm.tsx` — keep active only
- `ClassAndPreferencesFields.tsx` — keep active only for enrollment forms
- `ClassInvitationSelector.tsx` — keep active only

### Impact
One line change: `useClassTypes()` → `useClassTypes(true)` in `useHandlersData.ts`. All historical data becomes visible again across both branches.

