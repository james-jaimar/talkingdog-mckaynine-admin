

# Add Term Selector to Mobile View

## Problem
Line 163 of `Header.tsx` has `!isMobile`, so the `TermSelectorRow` is completely hidden on mobile.

## Fix

### `src/components/layout/Header.tsx`
1. **Always render `TermSelectorRow`** — remove `!isMobile` from line 163, changing it to `{user && <TermSelectorRow />}`

### `src/components/layout/header/TermSelectorRow.tsx`
2. **Make layout responsive** — the current row uses `flex items-center justify-between` which won't fit on a 390px screen with all elements side by side. Changes:
   - Stack the term info above the selectors on mobile (`flex-col md:flex-row`)
   - Make the year/term selects narrower on mobile (`w-[90px]` instead of `w-[120px]`)
   - Hide the date range text on very small screens to save space
   - Keep the compact layout: `[Calendar icon] Term 2, 2026` on one line, year + term selects + refresh on the next line

One file change, one layout tweak. No logic changes needed.

