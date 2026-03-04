

## Fix: Trainer view needs Randburg Puppy numbered sessions (1-6)

### Problem
The trainer's `TrainerClassDetail.tsx` always shows grade buttons A-F and displays all 12 grade key entries. It has no detection for Randburg Puppy classes because:
1. The query fetches `branch_id` but never resolves the branch **name**
2. Grade button arrays are hardcoded to `['A','B','C','D','E','F']`
3. The grade key card shows ALL `GRADE_INFO` entries (both A-F and 1-6)

The admin view works because `ClassHandlersTable` receives `branchName` as a prop and passes it through to `AttendanceStatusCell`.

### Changes in `src/pages/trainer/TrainerClassDetail.tsx`

1. **Expand the Supabase query** (line 78-85) to join the `branches` table:
   ```
   classes:class_id (
     id, name, class_type, capacity, description, branch_id,
     branches:branch_id (id, name)
   )
   ```

2. **Derive `isRandburgPuppy`** after the query resolves:
   ```typescript
   const isRandburgPuppy = schedule?.classes?.branches?.name?.toLowerCase().includes('randburg') 
     && schedule?.classes?.class_type?.toLowerCase() === 'puppy';
   ```

3. **Update the `PerformanceGrade` type** (line 34) to include numeric grades:
   ```typescript
   type PerformanceGrade = 'A' | 'B' | 'C' | 'D' | 'E' | 'F' | '1' | '2' | '3' | '4' | '5' | '6' | null;
   ```

4. **Conditionally render grade buttons** on lines 560 and 691:
   - Use `['1','2','3','4','5','6']` when `isRandburgPuppy`, otherwise `['A','B','C','D','E','F']`

5. **Filter the grade key card** (line 416) to only show relevant grades based on `isRandburgPuppy`

6. **Remove the branch check** on lines 112-116 that returns `null` when the class doesn't match `currentBranch` — trainers may not have the correct branch selected, and this check is what causes the "class not found" issue for trainer Therese

### File to modify
- `src/pages/trainer/TrainerClassDetail.tsx`

