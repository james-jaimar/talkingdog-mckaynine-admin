

# Fix: Make All Status Icons Consistently Clickable

## Problem
In `HandlerStatusCell.tsx`, status icons are only wrapped in a clickable `Popover` when there are pending tasks (`hasTasks`). Otherwise they render as hover-only `Tooltip`s. This means if a task was never created, or was already completed/cancelled, the icon appears but can't be clicked — confusing when some handlers' icons are clickable and others aren't.

A secondary issue: the "Wants Info" class selections (`wantsInfoClasses` in `ClassStatusCell.tsx`) are stored only in component state and never persisted to the database, so if a save partially fails or the user doesn't select classes, context is lost.

## Changes

### 1. `src/components/handlers/table/HandlerStatusCell.tsx`
- Remove the `hasTasks` conditional branching
- Always use the `Popover` wrapper for status icons
- Show a status summary section (action type, class, dog) inside the popover regardless of tasks
- Below the summary, show pending tasks if any, or a "No pending tasks" note

### 2. `src/components/handlers/table/ClassStatusCell.tsx`
- Store the selected `wantsInfoClasses` in the `handler_class_status` record (using the existing `result_notes` or a dedicated field) so the info isn't lost on save
- Initialise `wantsInfoClasses` from the saved data when the popover opens

**2 files, ~30 lines changed.**

