
# Fix: Substitute Trainers Can't See Their Classes

## Problem

Nadia (and all substitute trainers) can see earnings in "My Earnings" but cannot see any classes in "My Classes" or open class detail/attendance pages. This affects two pages:

1. **TrainerClasses.tsx** (line 100): `.eq('trainer_id', trainerProfile.id)` — only fetches schedules where the trainer is the primary trainer
2. **TrainerClassDetail.tsx** (line 111): `.eq('trainer_id', trainerProfile.id)` — blocks substitute trainers from viewing/managing attendance for classes they're substituting

## Fix

### 1. `src/pages/trainer/TrainerClasses.tsx`
- After fetching the trainer's own schedules, also query `class_date_substitutes` for this trainer to find additional schedule IDs where they're a substitute
- Fetch those extra schedules and merge them into the list
- Mark substitute classes visually (e.g., a "Substitute" badge) so the trainer knows which are theirs vs. substituted

### 2. `src/pages/trainer/TrainerClassDetail.tsx`
- Remove `.eq('trainer_id', trainerProfile.id)` from the query
- Instead, fetch the schedule by ID only, then verify access: check if the trainer is either the primary trainer OR has a substitute record for this schedule
- This allows substitute trainers to view attendance and mark it for their assigned dates

### Implementation Detail

**TrainerClasses.tsx:**
```text
1. Add a query to fetch substitute records for this trainer
2. Collect the schedule IDs from those records
3. Fetch those schedules (excluding ones already fetched as primary)
4. Merge both sets, tagging substituted ones with a flag
5. Show a "Sub" badge on substitute class cards
6. Filter substitute dates to only show relevant upcoming/past dates
```

**TrainerClassDetail.tsx:**
```text
1. Change query: .eq('id', scheduleId) only (remove trainer_id filter)
2. After fetching, verify access by checking:
   - schedule.trainer_id === trainerProfile.id, OR
   - EXISTS in class_date_substitutes for this schedule + trainer
3. If neither, show "Access restricted"
4. Optionally show a banner: "You are substituting for [original trainer]"
```

### Files Changed
1. `src/pages/trainer/TrainerClasses.tsx` — add substitute schedule fetching + merge + badge
2. `src/pages/trainer/TrainerClassDetail.tsx` — relax trainer_id filter, add substitute access check
