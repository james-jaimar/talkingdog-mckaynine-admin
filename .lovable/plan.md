

## Two Issues Found

### Issue 1: Race Condition (Primary Bug)
The Handlers table shows `class_statuses: []` for ALL handlers, including those with data in `handler_class_status` (e.g., Amanda Steyn has 2 Puppy records).

**Root cause**: In `useHandlersData.ts`, the handlers query uses `classTypeNames` (from `useClassTypes(true)`) to map class statuses at line 242. But `classTypeNames` is a separate async query that may still be loading (empty array `[]`) when the handlers query runs. Since `classTypeNames` is not in the handlers query key, the query never re-runs when class types finish loading.

**Fix**: Add `classTypeNames` to the handlers query key so it re-triggers when class types load:
```
queryKey: ['handlers', currentBranch?.id, classTypeNames]
```

Additionally, `HandlerTableRow` and `TableHeader` call `useClassTypes()` (active only), but `useHandlersData` maps with `useClassTypes(true)` (all types). Need to make the row/header also use `includeInactive = true` so historical columns appear.

### Issue 2: Legacy Data Backfill
There are 581 records in `class_enrollments` with free-text values like `"93,5% Mar 24"`, `"Did not grade Mar 24"`, `"Current 25"`, `"55% March 25, repeat"`. This legacy data has never been migrated to `handler_class_status`.

**Approach**: Write a one-time SQL migration that:
1. Reads each `class_enrollments` row and its 7 class columns (`puppy_class`, `eo_class`, etc.)
2. For each non-null value, extracts recognizable patterns:
   - **Percentage**: regex for `\d+[,.]?\d*%` → `pass_percentage`
   - **Period**: regex for month/year patterns like `Mar 24`, `Sep 2025` → `period`
   - **Status mapping**:
     - Contains "did not grade" → `did_not_grade`
     - Contains "incomplete" → `incomplete`
     - Contains "did not attend" → `did_not_attend`
     - Contains percentage ≥ 60% → `passed`
     - Contains percentage < 60% → `no_pass`
     - Contains "pass" (not "no pass"/"not pass") → `passed`
     - Contains "no pass"/"fail" → `no_pass`
     - Contains "current"/"enrolled" → `completed` (they were in a class)
     - Otherwise → store as notes only, no status
3. Stores the full original text in `result_notes` for reference
4. Links via `dog_id` from `class_enrollments.dog_id` and looks up `client_id` from `dogs.client_id`
5. Skips rows where a matching `handler_class_status` record already exists (same handler + class_type + dog_id)

**Column mapping**:
- `puppy_class` → class_type "Puppy"
- `eo_class` → "EO"
- `bronze_cgc_class` → "CGC Bronze"
- `silver_cgc_class` → "CGC Silver"
- `beginner_novice_class` → "Beginner"
- `wt_class` → "WT"
- `yoga_class` → "Yoga"

### Implementation Order
1. Fix the race condition in `useHandlersData.ts` (adds classTypeNames to queryKey)
2. Fix `HandlerTableRow` and `TableHeader` to use `useClassTypes(true)` for historical visibility
3. Run the backfill migration SQL
4. Verify data appears correctly

