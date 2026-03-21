

# Auto-Resolve Stale Status Icons via Enrollment + Email Checks

## Problem
Status icons show outdated actions. Example: Alex Martin shows "wants info for Puppy" but is already enrolled in a Puppy class. The current safety net only checks `handler_class_status.completed` — it doesn't check active enrollments or completed email tasks.

## Approach: Two-Layer Fix

### Layer 1: Enhanced Display-Side Safety Net (immediate, no DB changes)
**File: `src/components/handlers/hooks/useHandlersData.ts`** (~lines 260-278)

Currently the safety net suppresses a `next_action` only if the target class has a `completed=true` status record. Expand this to also check:

1. **Active enrollment**: Query `bookings` where `is_enrolled=true` for the handler+dog in a class of the target type. If enrolled → suppress the icon (they don't need info anymore, they're already in the class).
2. **Email already sent** (for `wants_info`): If `action_completed=true` already covers "info sent", but some records have tasks completed without marking the status. Check if all pending tasks for that handler+dog+class_type are completed/cancelled → treat as resolved.

Implementation: In the main `useHandlersData` query, also fetch active bookings per handler (one additional query joining `bookings → class_schedules → classes`). Then in the mapping loop, check if the target class type has an active enrollment for that dog.

### Layer 2: Auto-Resolve on Enrollment (proactive, catches it at source)
**File: `src/components/classes/handlers/hooks/add-handler-modal/addHandlerToClass.ts`**

When a handler is added to a class (enrolled), auto-resolve any outstanding `handler_class_status` records where:
- Same `handler_id` + `dog_id`
- `next_action` is `wants_info` or `continuing`
- `action_completed = false`
- `next_class_type` contains the class type being enrolled into

Set `action_completed = true`, `action_completed_at = now()`. Also complete any linked pending `handler_tasks`.

This means the moment someone is enrolled, any "wants info" or "continuing" action pointing to that class type gets resolved — no stale icons going forward.

### Layer 3: One-Time DB Cleanup
Run a data cleanup query to resolve all currently stale records where:
- A handler+dog has `next_action != 'none'` and `action_completed = false`
- AND the handler+dog is currently enrolled in a class matching `next_class_type`

## Files Changed
1. **`src/components/handlers/hooks/useHandlersData.ts`** — fetch active enrollments, expand safety net to check enrollment status (~20 lines)
2. **`src/components/classes/handlers/hooks/add-handler-modal/addHandlerToClass.ts`** — auto-resolve stale actions on enrollment (~15 lines)
3. **One-time SQL cleanup** — resolve existing stale records via data update

~35 lines of code changes + 1 data cleanup query.

