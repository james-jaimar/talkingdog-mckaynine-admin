

# Add Term-Based Task Grouping

## Problem
When Ady views tasks, they're all lumped together regardless of which term they relate to. Some handlers want info for the current term (April), others for future terms (July, October). There's no way to see at a glance which tasks belong to which term.

## Solution
Add a `target_term_id` column to `handler_tasks`, populate it during class closure, and group/filter tasks by term on the Tasks page.

## Changes

### 1. Database: Add `target_term_id` to `handler_tasks`
- Add `target_term_id uuid REFERENCES terms(id)` column
- This represents which term the task is *for* (e.g. "send info pack for Term 3")

### 2. Class Closure: Set `target_term_id` when creating tasks
In `ClassClosureModal.tsx`, when tasks are created for "wants_info" or "continuing" handlers:
- Look up the `terms` table using the handler's `next_term_number` and `next_term_year` to find the matching `term_id`
- Pass it as `target_term_id` on the inserted task
- If no specific term selected, leave null (current term implied)

### 3. Tasks Page: Add term grouping/filtering
On `src/pages/admin/Tasks.tsx`:
- Add a term filter dropdown (similar to existing class type filter) fetching available terms
- Default view: group tasks by term with section headers like "Term 2, 2026 (Apr–Jun)" and "Term 3, 2026 (Jul–Sep)"
- Tasks with no `target_term_id` shown under "Current Term" or "Unassigned"
- Add a "Term" column to the table showing the target term

### 4. Update hooks and types
- Add `target_term_id` to `TaskWithHandler` and `HandlerTask` interfaces
- Join `terms` table in `useAllTasks` query to get term display name
- Add term filter option to `useAllTasks`

### 5. Create Task Modal: Add optional term selector
- Allow manually setting a target term when creating tasks manually

## Technical Details

**Migration:**
```sql
ALTER TABLE public.handler_tasks 
  ADD COLUMN target_term_id uuid REFERENCES public.terms(id) ON DELETE SET NULL;
```

**Task query join** (in `useAllTasks`):
```
handler_tasks(*, handler:clients(...), target_term:terms(id, term_number, academic_year:academic_years(year)))
```

**Grouped view:** Tasks sorted into term buckets using `target_term_id`, displayed as collapsible sections with counts, so Ady can immediately see "5 tasks for Term 2, 3 tasks for Term 3".

