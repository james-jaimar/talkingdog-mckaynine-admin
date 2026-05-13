## Findings

- The 6 backfilled “Send info pack” tasks do exist in `handler_tasks` and are still `pending`.
- They are not visible on `/admin/tasks` when Delta is selected because their `handler_tasks.branch_id` is `NULL`.
- The task page correctly filters by the current branch: `useAllTasks(..., currentBranch?.id)`, so branchless tasks are excluded.
- The affected backfilled tasks all belong to Delta clients via `clients.branch_id`:
  - Dominique Jarvis — EO (Miley)
  - Susannah and Giana — CGC Bronze (Piper)
  - Kirsten Dorkin — CGC Bronze (Scout)
  - Jamie Peers — CGC Bronze (Phoenix)
  - Jamie Peers — CGC Bronze
  - Dean Nolte — CGC Silver
- There are also older pending Delta tasks with `NULL` branch IDs, which explains other “missing” task counts under branch filtering.

## Plan

1. **Backfill existing branchless tasks**
   - Run a database migration to set `handler_tasks.branch_id = clients.branch_id` for all existing tasks where:
     - `handler_tasks.branch_id` is missing
     - the task has a `handler_id`
     - the linked client has a `branch_id`
   - This will make the 6 new tasks appear under Delta immediately, and also restore visibility for older branchless Delta tasks.

2. **Fix the one-off backfill SQL pattern**
   - Update the recent task backfill migration pattern in the codebase so any future/manual backfill includes `branch_id` from `clients.branch_id`.
   - Keep the existing duplicate guard by `class_status_id`.

3. **Harden task creation paths**
   - Review `CreateTaskModal` and task creation hooks so newly created tasks always include a branch:
     - prefer the current selected branch
     - fallback to the handler/client branch if needed
   - Avoid changing unrelated task UI.

4. **Verify**
   - Query `handler_tasks` grouped by branch/status after the migration.
   - Confirm pending Delta tasks include the six Ady-related records and are no longer branchless.
   - Check that `/admin/tasks` with Delta selected should return more than the three currently visible tasks.