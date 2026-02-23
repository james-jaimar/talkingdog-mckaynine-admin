

# Fix: Settings Page Scrolling and Upload Queue Card Overflow

## Two Issues

1. **Page can't scroll**: The `fullWidth` change we made to `DashboardLayout` on the Settings page prevents scrolling for all tabs. The `fullWidth` prop should only affect the Intake Scans tab, not the entire Settings page. We need to revert `fullWidth` on Settings and instead apply it only within the Intake Scans tab content.

2. **Job cards clipped**: The `overflow-hidden` class added to the left column div is cutting off the trash/action buttons on the right edge of job cards. We need to remove `overflow-hidden` and instead ensure the card contents constrain themselves properly.

## Changes

### 1. `src/pages/admin/Settings.tsx`
- Revert `DashboardLayout fullWidth` back to just `<DashboardLayout>` -- full width should not apply to the entire admin page (Users, Branches, Trainers tabs all look fine with the container)
- Restore the `container mx-auto` wrapper on the outer div

### 2. `src/pages/admin/Settings.tsx` - IntakeScansTab
- Remove `overflow-hidden` from the left column div (line 105), keep `min-w-0`
- Wrap the entire IntakeScansTab in a container that breaks out of the parent container width using negative margins and full viewport width (e.g., a relative wrapper), or simply give the Intake Scans tab its own full-width styling

### 3. `src/components/intake-scans/UploadPanel.tsx`
- Ensure job card rows properly constrain content: the flex layout with `min-w-0` on the text content and `flex-shrink-0` on the action buttons is already correct
- The real fix is removing `overflow-hidden` from the parent column -- the `truncate` class on the filename paragraph already handles text overflow

### 4. `src/pages/admin/IntakeScans.tsx`
- Remove `overflow-hidden` from the left column div, keep `min-w-0`

## Technical Details

The core problem with `overflow-hidden` on the grid column: while it prevents the column from expanding, it also clips any content that touches the edges (like the trash icon button). The correct approach is `min-w-0` (which constrains flex/grid children) combined with `truncate` on text elements (which is already in place on the filename). No `overflow-hidden` is needed on the column wrapper.

For the scrolling issue, the Settings page should not use `fullWidth` at all -- only the standalone IntakeScans page needs it. The IntakeScansTab within Settings should work within the normal container, as the 12-column grid will distribute space proportionally regardless of container width.
