

# Fix: Target Month Dropdown — Default to Current Month & Scrollable

## Problems
1. The month list starts at September 2025 (6 months back), so the current month (March 2026) is off-screen when the dropdown opens
2. The dropdown in `EditTaskModal` doesn't have `max-h` set on `SelectContent`, so long lists aren't scrollable (the `CreateTaskFromNotesModal` already has `className="max-h-60"` but `EditTaskModal` does too — the real issue is the list starting at the wrong position)

## Fix

### `src/hooks/useMonthOptions.ts`
- Reduce backward range from 6 months to 2 months (rarely need to assign tasks to months that far back)
- Keep 12 months forward
- Total: 14 months instead of 18

### `src/components/tasks/EditTaskModal.tsx`
- Already has `max-h-60` on the month SelectContent — confirmed working
- No change needed here

### `src/components/tasks/CreateTaskModal.tsx`
- Check and ensure `max-h-60` is on the month SelectContent (consistency)

**1 file changed, ~2 lines.**

