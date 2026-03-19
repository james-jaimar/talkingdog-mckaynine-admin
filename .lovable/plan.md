

# Visually Distinguish the Status Column

## What
Add a subtle background colour and left/right borders to the Status column (header + all body cells) so it stands out as a distinct visual block within the busy table.

## How

### `src/components/handlers/table/TableHeader.tsx`
- Add a light background and border classes to the Status `<TableHead>`:
  `bg-blue-50 border-l border-r border-blue-200`

### `src/components/handlers/table/HandlerStatusCell.tsx`
- Add matching background and border classes to all returned `<TableCell>` elements (both the empty and populated variants):
  `bg-blue-50/50 border-l border-r border-blue-100`

This creates a subtle coloured "lane" down the table that's immediately scannable without being too heavy. The blue tint ties to the existing blue used for status icons.

**2 files changed, ~4 lines each.**

