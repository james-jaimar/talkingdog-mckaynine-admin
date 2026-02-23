

# Fix: Force Width Constraint Inside ScrollArea

## Root Cause (for real this time)

The Radix `ScrollArea` viewport renders an inner div with `display: table; min-width: 100%`. This means:
- The inner div expands to fit its content's natural width
- Any `overflow-hidden`, `truncate`, or `min-w-0` on children is meaningless because the parent has no fixed width -- it just grows
- The fixes we've been applying to the card rows are correct in isolation but are defeated by this parent behavior

## The Actual Fix

Wrap the job list content inside the `ScrollArea` with a div that has `overflow-hidden` and a hard width constraint (`w-full`). This creates a fixed-width boundary that the `display: table` parent cannot override.

### `src/components/intake-scans/UploadPanel.tsx`

Change the ScrollArea section (around line 148):

**Before:**
```tsx
<ScrollArea className="flex-1">
  <div className="space-y-2">
    ...jobs.map(...)
  </div>
</ScrollArea>
```

**After:**
```tsx
<ScrollArea className="flex-1">
  <div className="w-full overflow-hidden">
    <div className="space-y-2">
      ...jobs.map(...)
    </div>
  </div>
</ScrollArea>
```

That's it. One wrapper div. The `w-full` resolves to the ScrollArea viewport's width (100%), and `overflow-hidden` prevents the table layout from expanding beyond that. All existing card-level fixes (`truncate`, `min-w-0`, `flex-shrink-0`) then work as intended.

No other files need changes.

