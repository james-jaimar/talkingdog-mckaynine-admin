

## Problem

The auto-detection logic in `prepareScheduleData.ts` keeps assigning schedules to Term 1 regardless of what term the user is viewing. Three attempts to fix this with progressively complex fallback chains (`findTermForDate` → `currentTermId` → `findTermForSelection`) have all failed due to race conditions and stale context data.

## Solution

Rip out all automatic term detection. Instead, add a **mandatory term selector** (radio group) directly in the schedule form. When selected dates span multiple terms, the user must pick exactly one term. No guessing, no fallbacks.

### What gets removed
- `findTermForDate()` function in `prepareScheduleData.ts`
- `findTermForSelection()` function in `prepareScheduleData.ts`
- All term resolution logic (the 3-step fallback chain) in `prepareScheduleData.ts`
- `currentTermId`, `selectedYear`, `selectedTermNumber` params from `prepareScheduleData`, `useScheduleSubmit`, and `useClassScheduleForm`
- `spansMultipleTerms` and `relatedTermIds` from the form schema
- The entire `MultiTermOptions.tsx` component
- The `multiTermSubmission.ts` file (no longer needed)
- `spans_multiple_terms` and `multi_term_relation_id` from `ScheduleData` type

### What gets added

**1. New form field: `termId` (required string)**
- Added to `classScheduleFormSchema.ts`
- Pre-populated with the current term from TermContext

**2. New component: `TermSelector.tsx`**
- Replaces `MultiTermOptions.tsx` in `ClassScheduleFormFields.tsx`
- Fetches terms from DB (reuses existing query)
- Shows as a radio group with term labels (e.g. "Term 1 2026", "Term 2 2026")
- When dates span multiple terms, highlights a warning: "Your dates span multiple terms — please select which term this schedule belongs to"
- Always visible, always required
- Default-selected to match the active term in TermContext

**3. Simplified `prepareScheduleData.ts`**
- Accepts `termId: string` directly — no detection, no fallbacks
- Just uses the value from the form

### Files to modify

| File | Change |
|---|---|
| `schemas/classScheduleFormSchema.ts` | Remove `spansMultipleTerms`, `relatedTermIds`. Add required `termId` |
| `form-fields/MultiTermOptions.tsx` | Delete entirely |
| **New** `form-fields/TermSelector.tsx` | Radio group for term selection |
| `ClassScheduleFormFields.tsx` | Replace `MultiTermOptions` with `TermSelector` |
| `hooks/schedule-submission/prepareScheduleData.ts` | Strip all term detection. Accept `termId` param directly |
| `hooks/schedule-submission/types.ts` | Remove `currentTermId`, `selectedYear`, `selectedTermNumber` from props. Remove `multi_term_relation_id`, `spans_multiple_terms` from `ScheduleData` |
| `hooks/schedule-submission/multiTermSubmission.ts` | Delete entirely |
| `hooks/useScheduleSubmit.ts` | Remove term-related props, pass `data.termId` to `prepareScheduleData`. Remove multi-term branch |
| `hooks/useClassScheduleForm.ts` | Remove term context usage for submission. Set default `termId` from `termData?.id` |

### Data fix SQL

```sql
UPDATE class_schedules 
SET term_id = 'c7951cbb-de96-47b1-bf05-69b512b7f5da'
WHERE class_id = '6d0f3704-2bfe-4352-8163-d95a03b5b857'
  AND term_id = 'af8f86a4-6a26-4415-be4d-b388d7e942c1';
```

