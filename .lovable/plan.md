

# Show Substitute Trainers in Financial Report

## Problem

Two issues with how substitute trainers appear in the Trainers financial report:

1. **Substitute trainers not showing up at all** -- The `fetchTrainers()` function only finds trainers who are the *original* trainer on class schedules in the branch. If a trainer substitutes at a branch where they don't have their own classes, they're completely invisible in the report.

2. **No substitution details visible** -- When expanding a trainer's class details, there's no indication of which dates had substitutes, who the substitute was, or how much they earned for those dates.

## What Changes

### 1. Include substitute trainers in the trainer list

Update `fetchTrainers()` in `fetchTrainerData.ts` to also find trainers who appear as substitutes (`substitute_trainer_id`) in `class_date_substitutes` for schedules in the current branch. These trainers will be added to the list alongside the regular trainers.

### 2. Show substitution info on class detail rows

Update `ClassDetailRow.tsx` to display substitution details when they exist for a class:
- An indicator showing "Substitute: X dates of Y" or "Subbing for [Original Trainer]"
- The pro-rated amount (already calculated in the data, just not displayed)

### 3. Add substitution details to TrainerClassDetail type

Add optional fields to the `TrainerClassDetail` type to carry substitution metadata for display:
- `isSubstitute` -- whether this trainer is subbing (not the original)
- `substituteInfo` -- details about substitutions (who, when, ratio)

---

## Technical Details

### File: `src/hooks/trainer-payments/queries/fetchTrainerData.ts`

**`fetchTrainers()` function** -- Add a second query to `class_date_substitutes` joined through `class_schedules` to `classes` to find substitute trainer IDs for the branch. Merge these with the existing trainer IDs (deduplicated) before fetching trainer details.

```
-- Pseudo-query:
SELECT DISTINCT substitute_trainer_id 
FROM class_date_substitutes cds
JOIN class_schedules cs ON cs.id = cds.class_schedule_id
JOIN classes c ON c.id = cs.class_id
WHERE c.branch_id = branchId
```

### File: `src/hooks/trainer-payments/types.ts`

Add to `TrainerClassDetail`:
- `isSubstitute?: boolean`
- `substituteDates?: number` (number of dates this trainer is subbing)
- `totalDates?: number` (total dates in the schedule)
- `originalTrainerName?: string` (if subbing, who they're subbing for)
- `substituteTrainerName?: string` (if original, who subbed for them)
- `substituteDatesList?: string[]` (actual dates of substitution)

### File: `src/hooks/trainer-payments/utils/formatTrainerData.ts`

Populate the new substitution fields on each `TrainerClassDetail` during the formatting pass. The pro-rating logic is already there -- we just need to attach the metadata so the UI can display it.

Also pass the trainers list (or a name lookup) so we can resolve trainer names for substitutes.

### File: `src/components/invoices/reports/class-details/ClassDetailRow.tsx`

Update the class detail row to show:
- If the trainer is a substitute: a badge/label like "Sub (3 of 10 dates)" with the original trainer's name
- If the trainer is the original but had substitutes: a note like "Sub covered 2 of 10 dates by [Sub Name]"
- The pro-rated commission is already reflected in the amounts

### File: `src/hooks/trainer-payments/useTrainerPaymentData.ts`

Pass the full trainers list into `formatTrainerPaymentData()` so it can resolve substitute trainer names for display. Minor signature change.
