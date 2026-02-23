

# Fix: Upload Queue Items Overflowing in ScrollArea

## Root Cause

The Radix UI `ScrollArea` component's internal viewport wraps children in a `div` with `min-width: 100%; display: table`. This causes child elements to expand to their natural content width rather than being constrained to the viewport width. As a result, `truncate` on the filename has no bounded parent width to truncate against -- the content just keeps expanding.

This explains the difference between the inline preview (narrower viewport, content happens to fit) and the full browser preview (wider viewport, content overflows).

## Fix

Two changes needed in `src/components/intake-scans/UploadPanel.tsx`:

### 1. Add `overflow-hidden` to each job card row

On the outer flex div of each job item (line 164), add `overflow-hidden` so the row itself constrains its content:

```
"flex items-center gap-2 p-2 rounded-lg border cursor-pointer transition-colors overflow-hidden"
```

This ensures each card row clips its content to the card boundary.

### 2. Add `max-w-full` to the filename paragraph

On line 171, reinforce the filename truncation:

```
<p className="text-sm font-medium truncate max-w-full">{job.filename}</p>
```

These two changes create a reliable width constraint chain regardless of what the ScrollArea viewport does internally.

---

## Technical Details

- The `ScrollAreaPrimitive.Viewport` renders a child div with `display: table; min-width: 100%` which defeats flex-based width constraints
- Adding `overflow-hidden` on the job card row forces it to respect its flex container's allocated width
- The `truncate` class then works correctly because it has a bounded ancestor
- No changes needed to the grid columns, DashboardLayout, or Settings page structure
- This fix works at all viewport widths

