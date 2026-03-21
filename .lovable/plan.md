

# Fix: Status Icon Hidden Despite Pending Tasks

## Root Cause

Two conflicting rules:
1. Line 48 in `HandlerStatusCell.tsx`: `if (s.action_completed) continue;` — skips ALL completed actions
2. Angela Glover has `action_completed = true` on her status records (set when the task was created), but the tasks themselves are still pending (send EO info for Whiskers, send CGC Bronze info for Pineapple)

The `action_completed` flag means "the admin recorded this and created a task" — NOT "the work is done." The icon disappears even though actual work remains.

## Fix

**File: `src/components/handlers/table/HandlerStatusCell.tsx`** (line 48)

Change the skip logic: only suppress the icon if `action_completed = true` AND there are no pending tasks for this handler. If pending tasks exist, the handler still needs attention — show the icon.

```typescript
// Before (too aggressive):
if (s.action_completed) continue;

// After (check pending tasks):
if (s.action_completed && pendingTasks.length === 0) continue;
```

This way:
- Angela Glover: `action_completed = true` but 2 pending tasks → icon SHOWS
- Old resolved handlers (no pending tasks): `action_completed = true`, 0 pending tasks → icon hidden (clean)

**1 file, 1 line changed.**

