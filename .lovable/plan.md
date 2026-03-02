

## Numbered Attendance for Randburg Branch

### What changes
For the Randburg branch only, the attendance "present" status will be replaced with numbers 1 through 6, representing which class session the handler is attending. The trainer clicks to cycle through: **not marked -> 1 -> 2 -> 3 -> 4 -> 5 -> 6 -> absent -> excused -> not marked**.

Other branches (e.g., Delta) keep the current green tick behavior unchanged.

### How it works
- A number (e.g., "3") in a green circle means the handler is **present** and it's their 3rd class
- The number is stored in the existing `performance_grade` column on the `class_attendance` table (no database changes needed)
- The `attendance_status` is set to `"present"` whenever a number is selected

### Technical Details

**1. Update `useAttendance.ts` hook**
- Add optional `performanceGrade` parameter to `UpdateAttendanceParams`
- Include `performance_grade` in both insert and update operations to Supabase

**2. Update `AttendanceStatusCell.tsx` (desktop)**
- Import `useBranch` to detect if current branch is Randburg
- For Randburg: change the status cycle to `not_marked -> 1 -> 2 -> 3 -> 4 -> 5 -> 6 -> absent -> excused -> not_marked`
- When cycling to a number, set `attendance_status = "present"` and `performance_grade = "1"` (or 2, 3, etc.)
- When cycling to absent/excused/not_marked, clear `performance_grade`
- Display the number inside the green circle instead of the checkmark
- For non-Randburg branches: no change to existing behavior

**3. Update `MobileHandlerCard.tsx` (mobile)**
- Import `useBranch` to detect Randburg
- For Randburg: replace the single "Present" (checkmark) button with 6 numbered buttons (1-6), each in a green style
- Keep absent and excused buttons as-is
- When a number is tapped, mark as present with that number as `performance_grade`

**4. Update `BatchAttendanceModal.tsx`**
- For Randburg: replace the single "Present" button with a number selector (1-6)
- Same storage logic: status = "present", grade = number

### Files to modify
- `src/components/class-handlers/attendance/useAttendance.ts` - add performanceGrade param
- `src/components/class-handlers/attendance/AttendanceStatusCell.tsx` - Randburg numbered cycle
- `src/components/class-handlers/mobile/MobileHandlerCard.tsx` - Randburg numbered buttons
- `src/components/class-handlers/attendance/BatchAttendanceModal.tsx` - Randburg number picker

No database migration needed -- uses the existing `performance_grade` column.

