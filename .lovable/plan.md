

# Fix: Intake Scans Upload Queue Column Too Narrow

## Problem

The Upload & Queue panel uses `col-span-3` (25% width) in a 12-column grid. The job list items contain a filename, subtitle, status badge, action buttons (Play/Retry + Delete), which together overflow the available width, hiding the delete button.

## Solution

Two complementary changes to make everything fit:

### 1. Widen the left column, narrow the center column

**File: `src/pages/admin/Settings.tsx`** (line 104-125)
- Change left panel from `col-span-3` to `col-span-4`
- Change center panel from `col-span-6` to `col-span-5`
- Right panel stays `col-span-3`
- Total remains 12

**File: `src/pages/admin/IntakeScans.tsx`** (same grid, standalone page)
- Apply the same column width change: 4 / 5 / 3

### 2. Compact the job list items in UploadPanel

**File: `src/components/intake-scans/UploadPanel.tsx`**

- Move the status badge below the filename (on the same line as the subtitle) instead of inline with the action buttons, freeing horizontal space
- This keeps all information visible without needing an even wider column

### Technical Detail

In `UploadPanel.tsx`, restructure the job list item layout so the badge sits under the filename alongside the extracted-name subtitle, and only the action icon buttons remain on the right side. This is a layout-only change within the existing `jobs.map()` render block.

