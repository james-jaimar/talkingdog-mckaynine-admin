## Findings

Investigated Ady's report against the database. Confirmed the exact symptom on **Robin Williams / Dan Erasmus** (`handler_class_status` row `751f947e-e6a3-422d-97dd-d72529ea863d`):

- CGC Bronze row has `next_action = 'wants_info'`, `action_completed = false` → status icon **shows** on Handlers page.
- All 3 linked `handler_tasks` are `status = 'cancelled'` → **nothing** in TaskBadge popover, **nothing** on Admin → Tasks page.

Two distinct bugs explain everything Ady is seeing:

### Bug 1 — Tasks not created when Ady changes target class
`src/components/handlers/ClassStatusCell.tsx` (~line 233) only inserts a `handler_tasks` row when `nextAction` itself changes. If the row already has `next_action = 'wants_info'` and Ady only edits the target class (`wantsInfoClasses` / `nextClassType`), `actionChanged === false` → no task created. Same for `continuing`.

### Bug 2 — Cancelling a task leaves the status icon stuck on
`src/hooks/useHandlerTasks.ts` (~line 130) `cancelTask` only flips `handler_tasks.status = 'cancelled'`. It never touches the linked `handler_class_status` row, so `action_completed` stays false and the icon shows forever. `completeTask` already does this correctly — only `cancelTask` is missing it.

## Fix Plan

**1. `src/components/handlers/ClassStatusCell.tsx`**
Replace the `actionChanged`-gated insert with a "reconcile to current intent" block:
- Look up existing pending `handler_tasks` for this `class_status_id`
- If one exists → update its target class
- Otherwise → insert a fresh task
- Add `queryClient.invalidateQueries({ queryKey: ["handlers-pending-tasks"] })` to the existing invalidation block (per the UI sync standard memory).

**2. `src/hooks/useHandlerTasks.ts`**
After `cancelTask` flips status to cancelled, also update the linked `handler_class_status`:
- Set `action_completed = true, action_completed_at = now()`
- Fallback (no `class_status_id`): match by handler + dog + class_type with `action_completed = false`, mirroring `completeTask`.

**3. One-off data cleanup (migration)**
```sql
-- Resolve Robin/Dan CGC Bronze
UPDATE handler_class_status
SET action_completed = true, action_completed_at = now()
WHERE id = '751f947e-e6a3-422d-97dd-d72529ea863d';

-- Sweep any other rows in the same orphaned state
UPDATE handler_class_status hcs
SET action_completed = true, action_completed_at = now()
WHERE action_completed = false
  AND next_action IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM handler_tasks ht
    WHERE ht.class_status_id = hcs.id
      AND ht.status = 'pending'
  )
  AND EXISTS (
    SELECT 1 FROM handler_tasks ht
    WHERE ht.class_status_id = hcs.id
  );
```

## Out of Scope
- Class closure modal task creation (working correctly).
- `HandlerStatusCell` icon computation logic (working correctly — it just reflects what bugs 1 & 2 leave behind).
