

# Fix: Task Badge Not Showing in Handlers + Missing Query Invalidation

## Issues Found

### Issue 1: Icon not showing in Handlers table
The `handlers-pending-tasks` query key (used in `useHandlersData.ts` line 76) is **never invalidated** by any task mutation — not in `CreateTaskModal`, `useAllTasks`, `useHandlerTasks`, or `CreateTaskFromNotesModal`. This means:
- After creating/completing/cancelling tasks, navigating back to the Handlers page shows stale badge data
- The `has_tasks` filter count is also stale
- `refetchOnWindowFocus: false` makes it worse — even tabbing away and back won't refresh

### Issue 2: Only seeing 1 task for Angela Glover
The database confirms only **1 pending task** exists for Angela Glover (handler_id `c424f5e3-...`). The second task the user created either failed silently or wasn't submitted. This appears to be a data issue rather than a code bug — the `CreateTaskModal` insert logic looks correct and shows error toasts on failure.

## Fix

Add `handlers-pending-tasks` to all query invalidation lists across **4 files**:

1. **`src/components/tasks/CreateTaskModal.tsx`** — add `queryClient.invalidateQueries({ queryKey: ["handlers-pending-tasks"] })` after task creation
2. **`src/hooks/useAllTasks.ts`** — add to `completeTask`, `cancelTask`, `updateTask`, and `deleteTask` onSuccess handlers
3. **`src/hooks/useHandlerTasks.ts`** — add to `completeTask`, `createTask`, and `cancelTask` onSuccess handlers
4. **`src/components/handlers/table/CreateTaskFromNotesModal.tsx`** — add after task creation invalidation

This ensures the Handlers table TaskBadge and filter counts stay in sync after any task mutation.

## Technical Details

Each file's mutation `onSuccess` blocks need one additional line:
```typescript
queryClient.invalidateQueries({ queryKey: ["handlers-pending-tasks"] });
```

~8 lines added across 4 files.

