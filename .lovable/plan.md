

# Make Tasks Branch-Specific

## Problem
The `handler_tasks` table has no `branch_id` column. All task queries (`useAllTasks`, `usePendingTaskCount`, `useHandlerTasks`) fetch tasks across all branches. When switching branches, admins see tasks from every branch mixed together.

## Solution

### 1. Add `branch_id` column to `handler_tasks` table
Add a nullable `branch_id` (uuid) column with a foreign key to `branches`. Nullable so existing tasks aren't broken.

### 2. Backfill existing tasks
Update existing tasks to inherit `branch_id` from their linked handler (client):
```text
UPDATE handler_tasks
SET branch_id = clients.branch_id
FROM clients
WHERE handler_tasks.handler_id = clients.id
  AND handler_tasks.branch_id IS NULL;
```

### 3. Filter queries by current branch

**`src/hooks/useAllTasks.ts`** -- Both `useAllTasks` and `usePendingTaskCount`:
- Accept `branchId` parameter
- Add `.eq("branch_id", branchId)` filter to the Supabase query

**`src/hooks/useHandlerTasks.ts`** -- `pendingCountQuery`:
- Not used on the Tasks page directly, but the pending count in the nav badge should also be branch-filtered

### 4. Pass branch context into queries

**`src/pages/admin/Tasks.tsx`**:
- Import `useBranch` and pass `currentBranch?.id` to `useAllTasks`

**`src/components/layout/header/AdminNavigation.tsx`**:
- Pass current branch ID to the pending task count hook

### 5. Set `branch_id` on task creation (7 locations)

Every place that inserts into `handler_tasks` needs to include `branch_id`. The branch comes from either:
- The handler's `branch_id` (looked up from `clients`)
- The current branch context
- The class's `branch_id`

Files to update:
- `src/components/tasks/CreateTaskModal.tsx` -- use current branch from context
- `src/components/handlers/table/CreateTaskFromNotesModal.tsx` -- use current branch
- `src/components/trainer/TrainerNoteModal.tsx` -- use current branch
- `src/components/classes/closure/ClassClosureModal.tsx` -- use class branch
- `src/components/handlers/table/ClassStatusCell.tsx` -- use current branch
- `src/components/classes/handlers/hooks/add-handler-modal/rebalanceHouseholdInvoices.ts` -- use branch from invoice/class context
- `src/hooks/useHandlerTasks.ts` (createTask) -- caller must provide branch_id

## Summary of Changes

| Area | Change |
|------|--------|
| Database | Add `branch_id` column + backfill from handler's branch |
| `useAllTasks` | Filter by `branch_id` |
| `usePendingTaskCount` | Filter by `branch_id` |
| Tasks page | Pass current branch to hook |
| Admin nav badge | Pass current branch to count hook |
| 7 insert locations | Include `branch_id` on every new task |

