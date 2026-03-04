

## Fix: Trainer Randburg Puppy view must match admin attendance UI exactly

### The Problem
The trainer view (`TrainerClassDetail.tsx`) currently has a **two-step** process: first mark present/absent/excused, then pick a "grade" (1-6). This is wrong. The admin view (`AttendanceStatusCell.tsx`) uses a **single-step** cycle: click once to cycle through `not_marked → 1 → 2 → 3 → 4 → 5 → 6 → absent → excused → not_marked`. Each number is shown as a green circle. There is no separate "grade" concept for Randburg Puppy -- the number IS the attendance mark.

### What the admin does (working correctly)
- Single circular button per date cell
- Click cycles through the statuses
- Numbers 1-6 store as `attendance_status = 'present'` + `performance_grade = '1'` through `'6'`
- Absent/excused are standard statuses
- No separate grade row

### Changes to `src/pages/trainer/TrainerClassDetail.tsx`

**1. Randburg Puppy attendance: replace two-step with single-step numbered buttons**

For Randburg Puppy classes, instead of showing 3 attendance buttons + 6 grade buttons:
- Show 6 numbered buttons (1-6) + absent + excused buttons in a single row
- Clicking a number sets `attendance_status = 'present'` and `performance_grade = that number` in one call
- Clicking the same number again clears it (sets to `not_marked`)
- Remove the separate "Grade" row entirely for Randburg Puppy
- Remove the "Mark present to grade" message for Randburg Puppy

**2. Update labels**
- Change "Performance Grade Key" → "Session Week Key" for Randburg Puppy
- Change "Mark Attendance & Grade" → "Mark Attendance" for Randburg Puppy
- The badge should show "Week: 3" not "Grade: 3"

**3. Desktop table (line ~508-606)**
- When `isRandburgPuppy`: merge the Attendance + Grade columns into one
- Show numbered circle buttons 1-6 + absent + excused in a single cell
- Hide the separate "Performance Grade" column

**4. Mobile view (line ~610-709)**
- When `isRandburgPuppy`: show numbered buttons 1-6 + absent + excused in the attendance row
- Remove the separate "Grade" row

**5. Update `updateAttendance` function for Randburg**
- When a numbered button is clicked: set both `attendance_status = 'present'` and `performance_grade` in one update
- When clicked again (toggle off): set `attendance_status = 'not_marked'` and clear grade

### File to modify
- `src/pages/trainer/TrainerClassDetail.tsx`

