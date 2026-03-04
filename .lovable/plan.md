

## Fix: TrainerClassDetail crashes on Randburg Puppy numeric grades

### Root Cause
Line 620 in `TrainerClassDetail.tsx` does `GRADE_INFO[grade].bgColor` where `grade` can be "1"-"6" for Randburg Puppy classes. `GRADE_INFO` only contains keys A-F, so the lookup returns `undefined` and accessing `.bgColor` crashes.

### Fix
In `TrainerClassDetail.tsx`:

1. **Add numeric grades to `GRADE_INFO`** (or a separate map) so "1"-"6" have display info
2. **Add a safety check** on line 620 before accessing `GRADE_INFO[grade]` — use optional chaining or a fallback

Specifically:
- Expand `GRADE_INFO` to include entries for "1" through "6" with appropriate labels (e.g., "Class 1", "Class 2", etc.) and green-toned styling
- Guard the mobile badge on line 620: `GRADE_INFO[grade]?.bgColor` with a fallback
- The `GradeButton` on line 308 has the same issue — guard `gradeInfo` there too

### File to modify
- `src/pages/trainer/TrainerClassDetail.tsx`

