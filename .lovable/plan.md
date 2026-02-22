

# Fix: Intake Scans Page Not Using Full Width in Large Viewports

## Problem

The `DashboardLayout` wraps all content in a `container mx-auto` div, which applies Tailwind's default max-width breakpoints (e.g., max-width: 1280px at xl). In the smaller Lovable preview window, the viewport is narrower than this max-width, so the 3-column grid fits fine. But in a full browser window (1920px+), the container constrains the grid, squeezing the columns.

## Solution

Add a `fullWidth` prop to `DashboardLayout` that skips the `container` class, allowing pages like Intake Scans to use the full viewport width.

### Changes

**1. `src/components/layout/DashboardLayout.tsx`**
- Add an optional `fullWidth` boolean prop
- When `fullWidth` is true, use `w-full px-3 sm:px-4 md:px-6` instead of `container mx-auto px-3...`

**2. `src/pages/admin/IntakeScans.tsx`**
- Pass `fullWidth` to `DashboardLayout`:
  ```
  <DashboardLayout fullWidth>
  ```

This is a minimal, targeted fix -- no other pages are affected.

