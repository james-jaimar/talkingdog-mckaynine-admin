

## Two Issues from Ady

### Issue 1: Tasks created for wrong dog (both tasks showed Bennie instead of Bennie + Romy)

**Root cause**: The `handler_tasks` table has no `dog_id` or `dog_name` column. When tasks are created (from class closure or from the handler table status cells), only `handler_id` is saved. The dog context is lost entirely. So both tasks for Robin Williams just say "Send info pack" without distinguishing which dog they're for.

**Fix**:
1. **DB migration**: Add `dog_id` (uuid, nullable, FK to dogs) and `dog_name` (text, nullable) columns to `handler_tasks`
2. **ClassClosureModal** (lines 195-205): When creating tasks, look up the `dog_id` from the booking and include `dog_id` and `dog_name` from `handler.dog_name`
3. **ClassStatusCell** (lines 229-241): When creating tasks, include `dog_id` (from `selectedDogId` or `initialDogId`) and `dog_name` (from `selectedDogName`)
4. **Task display** (Tasks page, TaskBadge, HandlerTasks): Show dog name alongside handler name so tasks like "Send Silver CGC info pack (Romy)" are distinguishable
5. **SendInfoPackModal**: Pass dog info through so the correct dog context is used when sending
6. **useHandlerTasks** and **useAllTasks**: Update the HandlerTask interface to include the new fields

### Issue 2: Visual indicator on handlers page showing info has been sent

**Root cause**: The `handler_class_status` table already tracks `action_completed` (set to `true` when info is sent via SendInfoPackModal). But `ClassStatusCell.renderActionIndicator()` doesn't check this field — it always shows the blue envelope or green arrow regardless of whether the action was completed.

**Fix**:
1. **Fetch `action_completed`** in the handlers data query (in `useHandlersData`) — it likely already comes through `handler_class_status`
2. **Add `action_completed` to `ClassStatusItem` interface** in ClassStatusCell
3. **Update `renderActionIndicator()`**: When `action_completed` is true, change the icon style — e.g., show a green checkmark overlay or change the envelope to a "sent" icon (like `MailCheck` from lucide) with a distinct color (green instead of blue) so Ady can see at a glance who has been contacted
4. **Pass the field through** from `useHandlersData` → `HandlerTableRow` → `ClassStatusCell`

### Files to modify
- **DB migration**: Add `dog_id` and `dog_name` to `handler_tasks`
- `src/components/classes/closure/ClassClosureModal.tsx` — include dog info in task creation
- `src/components/handlers/table/ClassStatusCell.tsx` — include dog info in task creation + show action_completed visual
- `src/hooks/useHandlerTasks.ts` — update interface
- `src/hooks/useAllTasks.ts` — update interface
- `src/pages/admin/Tasks.tsx` — display dog name
- `src/components/handlers/detail/HandlerTasks.tsx` — display dog name
- `src/components/handlers/TaskBadge.tsx` — display dog name
- `src/components/handlers/hooks/useHandlersData.ts` — pass `action_completed` through
- `src/components/tasks/SendInfoPackModal.tsx` — minor: use dog_name from task if available

