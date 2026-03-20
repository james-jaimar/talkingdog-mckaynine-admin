
I dug into both code and live DB state for Angela, and the current behavior is consistent with a deeper linkage bug (not just caching).

1) What is actually broken (confirmed)
- Angela has two dogs (`Pineapple`, `Whiskers`), but some follow-up tasks were created without a `class_status_id`.
- Her status rows still have `next_action` records with `next_class_type = null`, so stale icons cannot be auto-resolved reliably.
- The status popover currently displays `class_type` (source class) instead of the intended target class, which makes rows look “wrongly linked”.
- `ClassClosureModal` creates wants-info tasks even when status linking is weak, and task completion flows only sync status when `class_status_id` exists.

2) Root causes in code
- `src/components/classes/closure/ClassClosureModal.tsx`
  - Upsert uses `onConflict: 'id'` without supplying `id` in payload.
  - Tasks are inserted without `class_status_id`.
  - Wants-info fallback class is used in task title but not consistently persisted to `handler_class_status.next_class_type`.
- `src/components/handlers/table/ClassStatusCell.tsx`
  - For `wants_info`, `next_class_type` is null when no chip is selected (even though a fallback class is used for task title).
- Completion paths (`useHandlerTasks`, `useAllTasks`, `SendInfoPackModal`)
  - Only set `action_completed` when `task.class_status_id` is present.
- Display logic (`useHandlersData`, `HandlerStatusCell`)
  - Uses source class in summary and doesn’t fully suppress stale actions when linkage is missing/incomplete.

3) Implementation plan (revised)
- A. Fix status-task linkage at creation time
  - In `ClassClosureModal.tsx`, fetch `dog_id` first, resolve target class for wants-info, persist it into `next_class_type`, and ensure the status write returns a stable status row ID.
  - Insert tasks with `class_status_id` populated from that saved status row.
  - Do not create follow-up task if status write fails.
- B. Persist deterministic target class for wants-info everywhere
  - In `ClassStatusCell.tsx`, always save `next_class_type` for `wants_info`:
    - selected chips when provided
    - otherwise fallback to class progression map (e.g. EO → CGC Bronze).
- C. Make task completion robust even for legacy unlinked tasks
  - Update `useHandlerTasks.ts`, `useAllTasks.ts`, and `SendInfoPackModal.tsx`:
    - if `class_status_id` exists, update directly (current behavior).
    - else fallback-match status by `handler_id + dog_id + class_type + active next_action`, then mark `action_completed`.
- D. Fix status lane rendering to show real intent + suppress stale items
  - In `useHandlersData.ts`, compute “effective target classes” from `next_class_type` or fallback map.
  - Suppress icons when target class has already been attempted/completed for that dog (not only strictly `completed=true`).
  - In `HandlerStatusCell.tsx`, display target classes in summary (not source class labels).
- E. One-time DB cleanup migration
  - Backfill `next_class_type` where null for wants-info using `class_types.next_class_type`.
  - Backfill `class_status_id` for legacy pending/completed send-info/enrollment tasks where unambiguous match exists.
  - Reconcile `action_completed=true` where completed tasks already exist.
  - Cancel truly orphaned pending follow-up tasks that no longer match the current status action.

4) Validation checklist after implementation
- Angela:
  - stale puppy/EO info icons removed when no longer relevant.
  - pending tasks correctly show per dog and no false “both Whiskers” caused by bad links.
- Ariana (and other previously affected handlers):
  - status icon click opens consistent summary with correct target class labels.
- End-to-end:
  - create wants-info from class closure for two dogs, complete one task, verify only that dog’s status resolves.
  - hard refresh + external preview confirm identical output.
