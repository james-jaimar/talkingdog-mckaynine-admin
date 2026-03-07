

## Make Class Type Activation Branch-Specific

### Problem
The `is_active` toggle on `class_types` is global. When Ady deactivates "Beginner" it disappears for all branches. Each branch should independently control which class types it uses.

### Solution

**New junction table: `branch_class_types`**
```
branch_class_types (
  id uuid PK,
  branch_id uuid NOT NULL references branches(id),
  class_type_id uuid NOT NULL references class_types(id),
  is_active boolean default true,
  unique(branch_id, class_type_id)
)
```

RLS: admins can CRUD, authenticated can SELECT.

**Seed on migration**: For each existing branch, insert a row for every class type, copying the current global `is_active` value. Then remove the `is_active` column from `class_types` (or keep it as a global master override — simpler to just remove it).

**Update `useClassTypes` hook:**
- Accept an optional `branchId` parameter
- When `branchId` is provided, join with `branch_class_types` to get branch-specific active status
- Return both the full list and the branch-filtered active list
- Consumers that need "all types" (e.g., admin CRUD) pass no branchId
- Consumers operating in a branch context (Handlers table, forms) pass the current branch ID

**Update `ClassTypesManager`:**
- Use `useBranch()` to get current branch context
- Toggle now updates `branch_class_types` for the current branch instead of the global `class_types.is_active`
- Description updates to say "Manage class types for [Branch Name]"
- Add/Edit/Reorder remain global (same types across all branches, same order)
- Only the active toggle is branch-specific

**Consumer files (no changes needed):**
- `useHandlersData.ts`, `TableHeader.tsx`, `HandlerTableRow.tsx`, `AddClassForm.tsx`, etc. already call `useClassTypes()` — they just need the hook to be branch-aware by default (hook reads from `useBranch()` internally).

### Technical Detail

The `useClassTypes` hook will internally call `useBranch()` and automatically filter by the current branch. For callers outside a branch context (unlikely but safe), it falls back to returning all globally-defined types.

Query approach: fetch all `class_types` ordered by `display_order`, then left join `branch_class_types` filtered by current branch. If no junction row exists, treat as inactive (or auto-create rows for new class types).

