

# Fix: Replace ScrollArea with Plain Overflow Container

## Why Previous Fixes Failed

Every fix so far has tried to constrain children inside the Radix `ScrollArea` viewport. But the viewport's internal structure uses `display: table; min-width: 100%` on a generated child div. This means:
- `w-full` resolves to 100% of the table, which grows with content -- no constraint
- `overflow-hidden` on children cannot work because the parent never stops growing
- `truncate`, `min-w-0`, `max-w-full` -- all defeated by the same root cause

No combination of child styles can fix a parent that expands infinitely.

## The Fix

Replace `<ScrollArea>` with a plain `<div className="flex-1 overflow-y-auto">` in `UploadPanel.tsx`. This gives us a normal block layout where `w-full`, `truncate`, and `overflow-hidden` work as expected.

### Changes in `src/components/intake-scans/UploadPanel.tsx`

**Before (lines 148-234):**
```tsx
<ScrollArea className="flex-1">
  <div className="w-full overflow-hidden">
  <div className="space-y-2">
    {/* ...job cards... */}
  </div>
  </div>
</ScrollArea>
```

**After:**
```tsx
<div className="flex-1 overflow-y-auto">
  <div className="space-y-2">
    {/* ...job cards... (unchanged) */}
  </div>
</div>
```

That's it. Remove the `ScrollArea` wrapper and its unnecessary inner `w-full overflow-hidden` div, replace with a simple scrollable div. All existing card-level classes (`truncate`, `min-w-0`, `overflow-hidden`, `flex-shrink-0`) will finally work because the parent uses normal block/flex layout.

The `ScrollArea` import can also be removed from the file since it's no longer used.

## Why This is Safe

- `ScrollArea` was only providing a styled scrollbar. `overflow-y-auto` provides native scrollbar behavior -- functionally identical
- No other component depends on this specific `ScrollArea` usage
- All job card markup stays exactly the same
