## Findings

Searched the database for handler intents (`handler_class_status` rows where Ady set `next_action = 'wants_info'` or `'continuing'` and the row is still open). Found **10 open intents in total**, of which **6 have zero `handler_tasks` ever created** — these are the missing tasks Ady is asking about.

(Note: there is no `updated_at` on `handler_class_status`, only `created_at`. The 6 orphans were all created on 2026-03-17, so what looks like "last week" to Ady is actually a longer-running gap that the earlier `ClassStatusCell` bug (only inserting when `next_action` itself changed) never recovered from. The fix I just shipped prevents new orphans, but won't retroactively create tasks for these.)

### The 6 orphans

| Handler | Dog | Current class | Wants info on | Status row id |
|---|---|---|---|---|
| Dominique Jarvis | Miley | Puppy | EO | `f85e7605-…` |
| Susannah and Giana | Piper | EO | CGC Bronze | `c449cbf9-…` |
| Kirsten Dorkin | Scout | EO | CGC Bronze | `75a6ec01-…` |
| Jamie Peers | Phoenix | EO | CGC Bronze | `e1e27a4f-…` |
| Jamie Peers | *(no dog linked)* | EO | CGC Bronze | `84676a8b-…` |
| Dean Nolte | *(no dog linked)* | CGC Bronze | CGC Silver | `0a630390-…` |

All 6 are `next_action = 'wants_info'`. None are `continuing`. 4 have a dog linked, 2 do not.

## Fix Plan

**One-off data backfill migration** — insert one pending `handler_tasks` row per orphan, mirroring what `ClassStatusCell` would have created had the bug not blocked it:

```sql
INSERT INTO handler_tasks (
  handler_id, class_status_id, class_type, dog_id,
  task_type, title, description, status
)
SELECT
  hcs.handler_id,
  hcs.id,
  hcs.class_type,
  hcs.dog_id,
  'send_info_pack',
  'Send info pack: ' || COALESCE(hcs.next_class_type, 'next class')
    || COALESCE(' (' || d.name || ')', ''),
  'Backfilled — handler asked for info on ' || COALESCE(hcs.next_class_type, 'next class')
    || ' after ' || hcs.class_type || '.',
  'pending'
FROM handler_class_status hcs
LEFT JOIN dogs d ON d.id = hcs.dog_id
WHERE hcs.next_action = 'wants_info'
  AND hcs.action_completed = false
  AND NOT EXISTS (
    SELECT 1 FROM handler_tasks ht WHERE ht.class_status_id = hcs.id
  );
```

This only touches rows that have **zero** tasks (so it can't double-up on anything), and creates exactly one `send_info_pack` task per orphan. After it runs:
- All 6 will appear on **Admin → Tasks**.
- The status icon on the Handlers page will now have something to show in its popover (it already shows the icon — that's how Ady spotted them).
- Handlers Ady processes from now on are protected by the `ClassStatusCell` reconcile fix shipped earlier.

## Out of Scope
- No code changes — the prevention fix is already live.
- Not touching the 4 already-resolved-or-task-bearing rows.
- Not creating `enrollment` tasks for any `continuing` rows because there are none in this orphan set.
