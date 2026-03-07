

## Make Class Types Database-Driven (CRUD Admin)

### Problem
Class types are hardcoded as a Postgres enum (`class_type`) and as `const` arrays in ~16 files across the app. Adding or removing a class type requires a database migration and code changes — Ady should be able to manage this herself.

### Approach

**Phase 1: New `class_types` table + Admin CRUD**

Create a `class_types` table to replace the Postgres enum as the source of truth. Add a "Class Types" tab to the Admin Settings page (`/admin/settings`) with full CRUD (add, edit, reorder, deactivate).

**Table: `class_types`**
- `id` uuid PK
- `name` text (unique, not null) — e.g. "Puppy", "EO", "CGC Bronze"
- `display_order` integer — controls column order in the Handlers table, dropdown order everywhere
- `is_active` boolean default true — soft-delete; inactive types hidden from forms but preserved in historical data
- `created_at` / `updated_at`
- RLS: admin can CRUD, authenticated can SELECT

**Phase 2: Migrate the `classes.class_type` column**

- Alter `classes.class_type` from the `class_type` enum to plain `text`
- Add a FK reference to `class_types.name` (or validate in app code)
- Seed `class_types` with the existing 9 enum values in the migration
- Drop the old `class_type` enum after migration

This is necessary because Postgres enums can't have values removed, and adding values requires migrations. A lookup table is the right pattern.

**Phase 3: Replace all hardcoded references**

1. **New hook: `src/hooks/useClassTypes.ts`**
   - Fetches from `class_types` table, ordered by `display_order`
   - Filters by `is_active` (with option to include inactive)
   - Long `staleTime` (30 min) — these rarely change
   - Returns `classTypes: { id, name, display_order, is_active }[]`

2. **Files to update** (replace hardcoded `CLASS_TYPES` with the hook or a prop):
   - `src/components/classes/schemas/classFormSchema.ts` — change `class_type` from `z.enum()` to `z.string().min(1)`
   - `src/components/classes/types/class-types.ts` — remove or keep as fallback only
   - `src/components/classes/AddClassForm.tsx` — use hook for dropdown
   - `src/components/classes/EditClassForm.tsx` — use hook for dropdown
   - `src/components/classes/closure/HandlerCompletionRow.tsx` — use hook for "next class" dropdown
   - `src/components/handlers/table/TableHeader.tsx` — receive dynamic list via props
   - `src/components/handlers/table/HandlerTableRow.tsx` — receive dynamic list via props
   - `src/components/handlers/hooks/useHandlersData.ts` — use hook, pass through
   - `src/components/handlers/HandlerTable.tsx` — pass through
   - `src/pages/Handlers.tsx` — pass through
   - `src/components/handlers/form/ClassAndPreferencesFields.tsx` — use hook for enrollment dropdowns
   - `src/components/email-templates/TemplateEditorModal.tsx` — use hook
   - `src/components/email-templates/AttachmentLibrary.tsx` — use hook
   - `src/components/handlers/table/CreateTaskFromNotesModal.tsx` — use hook
   - `src/components/tasks/CreateTaskModal.tsx` — use hook
   - `src/components/tasks/ClassInvitationSelector.tsx` — use hook
   - `src/components/enrollment/steps/Step6Class.tsx` — use hook (public-facing, needs unauthenticated access or pre-loaded data)

3. **Admin UI: `src/components/admin/ClassTypesManager.tsx`**
   - Table listing all class types with name, order, active status
   - Add/Edit modal (name + display order)
   - Toggle active/inactive
   - Drag-to-reorder or up/down arrows
   - Added as a new tab in `/admin/settings`

### Why This Order Matters
The database enum change and table creation must happen first. Then the hook. Then the UI updates can happen in parallel. The Admin CRUD is independent of the consumer updates.

### Migration Safety
- Seed the new table with existing enum values, preserving exact names
- Convert `classes.class_type` from enum to text in the same migration
- All existing data remains valid — the 9 values are preserved
- `handler_class_status.class_type` is already plain text, no change needed
- The old `class_type` enum is dropped after conversion

### What Stays the Same
- The `classTypeMap` in `ClassAndPreferencesFields.tsx` maps form field names to class type names — this pattern stays, but the mapping values come from the DB
- The "canonical order" concept is replaced by `display_order` from the DB

