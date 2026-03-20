

# Fix Stale Status Icons and Task-Dog Assignment

## What's Happening (from Angela Glover's data)

**Stale icons**: Angela's Puppy record for Pineapple still has `next_action: 'wants_info'` with `action_completed: true`, showing a green "Info Sent" icon — but she's already completed EO. The action is irrelevant now. Similarly, her EO records have `next_action: 'wants_info'` (for CGC Bronze info), which may or may not be current.

**Missing dog context on old tasks**: Her earliest tasks (created before dog-context was added) have `dog_id: null` and `dog_name: null`, so they showed under no dog / a single dog.

## Root Cause

When a handler completes a new class (e.g., EO), nothing goes back to update the *previous* class status record (Puppy) to clear its now-irrelevant `next_action`. The old "wants info" action lives forever.

## Plan

### 1. Auto-resolve stale actions on class completion
**File: `src/components/classes/hooks/useMarkHandlersCompleted.ts`**

After inserting a completion record for handler+dog in class X, run an update:
- Find all `handler_class_status` records for the same handler+dog where `next_action` is not 'none' and `action_completed` is false
- Where the `next_class_type` contains class X (the just-completed class), OR the class_type IS the same as X (handler re-did the same class)
- Set `action_completed = true` on those records

This clears stale Puppy → "wants EO info" actions once EO is actually completed.

### 2. Auto-resolve associated pending tasks
In the same completion flow, also mark any `handler_tasks` as 'completed' where:
- Same handler_id + dog_id
- Status is 'pending'
- The task references the just-completed class (via title pattern or class_status_id linkage)

### 3. Display-side safety net
**File: `src/components/handlers/hooks/useHandlersData.ts`**

When building the status icons data, filter out `next_action` entries where the handler+dog has already completed the class referenced in `next_class_type`. This catches any records that weren't auto-resolved (e.g., historical data).

### 4. Fix Angela's existing data (one-time cleanup)
Run a migration/query to:
- Clear stale `next_action` on Angela's Puppy/Pineapple record (action_completed=true, class already done)
- Backfill `dog_id`/`dog_name` on her older tasks where possible (match via `class_status_id`)

## Technical Details

**Files to edit:**
- `src/components/classes/hooks/useMarkHandlersCompleted.ts` — add post-completion cleanup logic (~15 lines)
- `src/components/handlers/hooks/useHandlersData.ts` — add display-side filtering for stale actions (~10 lines)
- One migration SQL — clean up existing stale data

**3 files, ~40 lines changed.**

