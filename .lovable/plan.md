

# Fix: Status Icons Mismatch + Null dog_id Safety Net Bypass

## Problem
Alex Martin shows "wants info for Puppy" icon, but Puppy is completed. The popover says "EO". Two bugs:

1. **Null `dog_id`**: 20+ status records have `dog_id = NULL`, so the safety net (which checks enrollment by dog_id) can never match and never suppresses the icon
2. **Wrong label**: The status summary shows the SOURCE class (Puppy) instead of the TARGET class (EO) — confusing when `next_class_type` exists

## Fix

### A. Handle null `dog_id` in safety net (`useHandlersData.ts`, ~line 295)
When `dog_id` is null, change the enrollment/completion check to match ANY dog of this handler (not a specific dog). If any of the handler's dogs are enrolled in or have completed the target class, suppress the icon.

### B. Show target class in status summary (`HandlerStatusCell.tsx`, ~line 59)
When building the `entries` array, if the status has a `next_class_type`, display that instead of `class_type`. E.g., show "EO" not "Puppy" for a wants_info about EO.

- Add `next_class_type` to the `ClassStatusItem` interface
- When pushing entries, use `next_class_type || class_type` as the display label

### C. DB cleanup: backfill `dog_id` where handler has exactly one dog
For status records with null `dog_id`, if the handler has only one dog, set `dog_id` to that dog's ID. This fixes the root cause for single-dog handlers.

## Files Changed
1. `src/components/handlers/hooks/useHandlersData.ts` — null dog_id handling (~5 lines)
2. `src/components/handlers/table/HandlerStatusCell.tsx` — show target class label (~3 lines)
3. DB migration — backfill dog_id for single-dog handlers

