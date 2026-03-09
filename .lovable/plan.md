

## Problem Analysis

The class **did not actually disappear** — it still exists in the database, and a schedule was also successfully created. The issue is a **term mismatch** causing the class to be filtered out of the current view.

### What Happened

1. Ady created the class "14h00 Elementary Obedience" while viewing **Term 2** (Apr-Jun 2026)
2. The schedule was created with dates spanning **both terms**: March 28 (Term 1) through June 26 (Term 2)
3. The system auto-determines the term based on the **first selected date** (March 28), which falls in **Term 1**
4. So the schedule was saved with `term_id = Term 1`
5. The class list query filters classes by term: it shows classes that either have a schedule in the selected term OR have no schedules at all
6. Since this class now has a schedule, but that schedule is tagged as Term 1, it no longer appears in the Term 2 view — making it look like it "disappeared"

### The Root Cause

The `prepareScheduleData` function uses `findTermForDate(firstDate)` to auto-assign the term. When dates span multiple terms, this silently assigns the wrong term. The multi-term detection exists in the UI (`MultiTermOptions` component) but relies on the user manually toggling it.

### Proposed Fix

**1. Immediate data fix** — Update the existing schedule's `term_id` to Term 2 (since most dates fall in Term 2), or better, the user should decide which term it belongs to.

**2. Code fix — Smart term assignment in `prepareScheduleData.ts`**
- When dates span multiple terms and `spansMultipleTerms` is not enabled, assign the term based on where the **majority** of dates fall, rather than the first date
- Alternatively, use the currently selected term from the TermContext as the default, since the user is already viewing that term

**3. Code fix — Use the selected term as default** (preferred approach)
- Pass the current `termId` from the TermContext into the schedule form
- Use it as the default `term_id` instead of auto-detecting from the first date
- This respects the user's intent — they're creating a schedule while viewing Term 2, so it should be a Term 2 schedule

### Implementation Steps

1. **Fix the existing data**: Provide SQL to update the schedule's `term_id` to Term 2 (`c7951cbb-de96-47b1-bf05-69b512b7f5da`)

2. **Update `prepareScheduleData.ts`**: Accept an optional `currentTermId` parameter and use it as the primary term assignment (falling back to auto-detection only when not provided)

3. **Update `useClassScheduleForm.ts`**: Pass the current term ID from context into the submission flow

4. **Update `useScheduleSubmit.ts`**: Thread the `currentTermId` through to `prepareScheduleData`

### Technical Details

Files to modify:
- `src/components/class-schedules/hooks/schedule-submission/prepareScheduleData.ts` — accept `currentTermId` param, use as primary term
- `src/components/class-schedules/hooks/schedule-submission/types.ts` — add `currentTermId` to props
- `src/components/class-schedules/hooks/useScheduleSubmit.ts` — pass term context
- `src/components/class-schedules/hooks/useClassScheduleForm.ts` — inject term from context

SQL to fix existing data:
```sql
UPDATE class_schedules 
SET term_id = 'c7951cbb-de96-47b1-bf05-69b512b7f5da'
WHERE id = 'cee7490d-9a99-4471-b784-5a213520cd1d';
```

