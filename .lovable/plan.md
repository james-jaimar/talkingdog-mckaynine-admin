

## Fix: Restrict Numbered Attendance to Randburg Puppy Classes Only + Fix DB Constraint

### Problem Summary
1. **Scope too broad**: The numbered attendance (1-6) currently applies to ALL Randburg classes, but should only apply to Randburg **Puppy** classes.
2. **Cycling broken**: Clicking to cycle attendance in Randburg classes throws a database error because the `performance_grade` column has a CHECK constraint that only allows `'A', 'B', 'C', 'D', 'E', 'F'` -- not `'1', '2', '3', '4', '5', '6'`.
3. **No data loss**: The CHECK constraint blocked all invalid writes, so existing attendance data is intact. No restoration needed.

### Changes

**1. Database migration -- update CHECK constraint**
- Drop the existing `class_attendance_performance_grade_check` constraint
- Add a new constraint allowing both letter grades (`A-F`) AND numeric grades (`1-6`)

**2. Narrow the condition from "isRandburg" to "isRandburgPuppy"**
The condition `isRandburg` needs to become `isRandburg AND classType is Puppy`. The `classType` prop already exists on `ClassHandlersTable` but isn't passed down to the attendance components. Changes needed in:

- **`AttendanceStatusCell.tsx`**: Add `classType` prop. Change condition from `isRandburg` to `isRandburg && classType === 'Puppy'`.
- **`MobileHandlerCard.tsx`**: Add `classType` prop. Same condition change.
- **`BatchAttendanceModal.tsx`**: Add `classType` prop. Same condition change.
- **`ClassHandlersTable.tsx`**: Pass `classType` down to `AttendanceStatusCell` (via `renderAttendanceStatus`), `MobileHandlersList` (which passes to `MobileHandlerCard`), and `BatchAttendanceModal`.
- **`MobileHandlersList.tsx`**: Accept and forward `classType` to `MobileHandlerCard`.

### Technical Details

```text
Condition change in all 3 attendance components:
  BEFORE: const isRandburg = currentBranch?.name?.toLowerCase().includes('randburg') ?? false;
  AFTER:  const isRandburgPuppy = (currentBranch?.name?.toLowerCase().includes('randburg') ?? false) 
            && classType?.toLowerCase() === 'puppy';
```

Then replace all uses of `isRandburg` with `isRandburgPuppy`.

**DB Migration SQL:**
```sql
ALTER TABLE class_attendance DROP CONSTRAINT class_attendance_performance_grade_check;
ALTER TABLE class_attendance ADD CONSTRAINT class_attendance_performance_grade_check 
  CHECK (performance_grade = ANY (ARRAY['A','B','C','D','E','F','1','2','3','4','5','6']));
```

### Files to modify
- `src/components/class-handlers/attendance/AttendanceStatusCell.tsx`
- `src/components/class-handlers/mobile/MobileHandlerCard.tsx`
- `src/components/class-handlers/attendance/BatchAttendanceModal.tsx`
- `src/components/class-handlers/ClassHandlersTable.tsx`
- `src/components/class-handlers/mobile/MobileHandlersList.tsx`
- Database migration (CHECK constraint update)

### No data restoration needed
The database CHECK constraint blocked all the numbered writes, so no invalid data was saved. All existing attendance records are untouched.
