

## Update Trainer Randburg Puppy Mobile View to Match Admin Layout

### Problem
The trainer mobile view for Randburg Puppy classes currently shows a **single circle** that cycles through statuses on each click. The admin mobile view shows **all 6 numbered buttons + absent + excused** visible at once, letting the trainer tap the exact week directly. The admin layout is far better UX.

### What Admin Mobile Shows (the target)
- Handler name, dog info, age in weeks, payment badge
- Phone number (tappable)
- Row of 6 numbered circle buttons (1-6), green when active
- Absent (X) and Excused (⚠) buttons at the end
- Edit button
- Tapping a number sets `attendance_status = 'present'` + `performance_grade = that number`
- Tapping the active number clears it back to `not_marked`

### Changes to `src/pages/trainer/TrainerClassDetail.tsx`

**Mobile section (lines 772-898) — Randburg Puppy branch only:**

Replace the single `RandburgStatusCircle` with a row of 6 numbered buttons + absent + excused, matching the admin's `MobileHandlerCard` pattern:

1. **Replace the `Week: [circle]` row** (lines 851-882) for Randburg Puppy with:
   - 6 numbered round buttons (1-6) in a flex-wrap row
   - Absent (X) and Excused (⚠) buttons
   - Active number = green filled circle, inactive = green outline
   - Active absent = red filled, active excused = amber filled

2. **Add a direct-tap handler** `handleRandburgDirectTap(booking, weekNum)` that:
   - If tapping the currently active week → clears to `not_marked` (toggle off)
   - If tapping a different week → sets `attendance_status = 'present'`, `performance_grade = weekNum`
   - For absent/excused → sets those statuses and clears grade

3. **Add attendance stats row** above the handler list (matching admin's `MobileAttendanceStats` pattern): Present count, Absent count, Excused count, Unmarked count — using the existing quick stats data

4. **Replace the dropdown date selector** with a **scrollable date pill picker** (matching admin's `MobileDateSelector`) for mobile only — horizontal scrollable row with day/date pills, arrow buttons on sides

5. **Desktop table (lines 660-768)** — keep `RandburgStatusCircle` (cycling is fine for desktop with tooltips)

### Summary of UI Changes (Mobile Randburg Puppy Only)
- Date selector: dropdown → scrollable pill picker
- Stats: bottom cards → inline stats row below date picker  
- Attendance: single cycling circle → 6 numbered buttons + absent + excused in a row
- Note button stays

### File to modify
- `src/pages/trainer/TrainerClassDetail.tsx`

