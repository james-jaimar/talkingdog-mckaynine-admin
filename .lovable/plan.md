## Item 1 — Will tasks now appear correctly going forward?

I audited every code path that inserts into `handler_tasks`. All four UI paths already set `branch_id` correctly today:

| Where tasks are created | Branch set? | Source of branch |
|---|---|---|
| `CreateTaskModal` (manual "+ New Task") | ✅ | `currentBranch?.id` |
| `CreateTaskFromNotesModal` (handler row → notes) | ✅ | `currentBranch?.id` |
| `ClassStatusCell` (Wants info / Continuing on Handlers grid) | ✅ | `currentBranch?.id` |
| `ClassClosureModal` (close-out wizard, the main bulk creator) | ✅ | `classBranchId` (the class's own branch — most accurate) |

So new tasks Adi or anyone else creates from the UI from now on **will** carry a `branch_id` and **will** appear under the correct branch tab on `/admin/tasks`. No code change is required for this to keep working.

The one remaining risk is anyone running another raw SQL backfill — see Item 2.

## Item 2 — Why did this happen? (Root cause)

This was **not** caused by a UI/feature code change. The codebase that creates tasks day-to-day was unchanged. The cause was a one-off SQL backfill migration we ran a few days ago.

What happened, in order:

1. Six `handler_class_status` rows existed where Adi had marked "wants info" on a handler, but no matching pending task had been created (older flow / pre-fix data).
2. To surface those as tasks for her to action, a backfill migration was run: `20260513173254_..._sql`. That migration inserts rows directly into `handler_tasks` with hard-coded columns:
   ```
   INSERT INTO handler_tasks
     (handler_id, class_status_id, class_type, dog_id,
      task_type, title, description, status)
   SELECT ...
   ```
   Notice `branch_id` is **not** in that column list, so all 6 inserted tasks landed with `branch_id = NULL`.
3. The Tasks page filters strictly by the selected branch (`useAllTasks(..., currentBranch?.id)` → `.eq('branch_id', branchId)`). Branchless tasks are correctly excluded — they belong to no branch as far as the filter is concerned.
4. Result: the 6 backfilled tasks existed in the DB but were invisible under both Delta and Randburg. Same root cause for a handful of older "ghost" pending tasks that pre-date the branch_id column being populated.
5. We fixed it with a second migration (`20260513175917_...`) that set `branch_id = clients.branch_id` for every branchless task. That's why they all showed up after that ran.

So the "breakage" was scoped to a backfill SQL pattern, not to the app. Adi's normal workflow (closing out a class, marking "wants info" from the Handlers grid, manually creating a task) was already correct and unchanged.

## Plan

### 1. Document the backfill SQL pattern so this doesn't recur
Add a short comment block to the existing one-off backfill migration noting that any future raw `INSERT INTO handler_tasks` MUST include `branch_id` (e.g. via `JOIN clients c ON c.id = hcs.handler_id` and selecting `c.branch_id`). This is the only realistic guard — migrations can't be re-run, but the next person writing one will see the warning.

### 2. (Optional, recommended) Add a defensive trigger
Add a `BEFORE INSERT` trigger on `handler_tasks` that, when `branch_id IS NULL` and `handler_id IS NOT NULL`, automatically populates `branch_id` from `clients.branch_id`. This makes the table self-healing for any future code path or SQL backfill that forgets the column. Zero impact on existing correct inserts.

### 3. No frontend code changes required
All four UI insert paths already set `branch_id` correctly. I don't recommend changing them — they're working as intended.

### 4. Verify
- After step 2, run `INSERT INTO handler_tasks (handler_id, task_type, title, status) VALUES (...)` without `branch_id` and confirm it auto-fills.
- Confirm Adi sees all current pending Delta tasks under the Delta filter (already true post-backfill).

## Out of scope
- No UI changes.
- No changes to `handler_class_status` logic.
- Not re-touching the already-fixed historical tasks.

Would you like me to proceed with **step 2 (the defensive trigger)** in addition to the migration comment, or just the comment?
