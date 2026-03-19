

# Add "Status" Column Between Name and Dogs

## What's Changing
A new column is inserted between **Name** and **Dogs** in the handlers table. This column consolidates the action indicators (Wants Info, Continuing, Stopping, Info Sent) that are currently crammed inside the tiny class status boxes. The class status cells will no longer show those icons — they'll just show the result (passed, Feb 2025, dog name, etc.).

## Why
The current layout packs too much into the small class cells — result badge + action icon + dog name + percentage. Ady can't quickly scan who needs what. A dedicated column gives clear, scannable visual indicators and allows filtering/sorting by status at a glance.

## How It Works

**New column renders one icon per active action** across all class statuses for that handler:
- 📧 Blue mail icon = Wants Info (not yet sent)
- ✅ Green mail-check = Info Sent (action completed)
- ➡️ Green arrow = Continuing
- ⏹️ Red stop = Stopping

If a handler has multiple actions (e.g., Wants Info for Puppy + Continuing for Beginner), all relevant icons show stacked or inline with tooltips showing which class/dog each relates to.

## Files to Change

### `src/components/handlers/table/TableHeader.tsx`
- Add `<TableHead>Status</TableHead>` between Name and Dogs columns

### `src/components/handlers/table/HandlerStatusCell.tsx` (new)
- New component that receives `class_statuses` array
- Renders consolidated action icons with tooltips showing class type + dog name context
- Groups by action type for clean display (e.g., one mail icon with "Puppy (Leia), Beginner (Toast)" tooltip if multiple)

### `src/components/handlers/table/HandlerTableRow.tsx`
- Add new `<HandlerStatusCell>` between the Name cell and Dogs cell
- Pass `handler.class_statuses` to it

### `src/components/handlers/table/ClassStatusCell.tsx`
- Remove `renderActionIndicator()` call from the status box display (lines 590-593)
- Keep the action indicator logic in the popover form (next action selector stays)
- The class cells now only show: result text, percentage, dog name — much cleaner

### `src/components/handlers/HandlerTable.tsx`
- Update `colSpan` for empty/loading states to account for the new column

