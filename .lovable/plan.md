

# Substitute Trainer Feature

## Overview

Allow a substitute trainer to fill in for specific dates within a class schedule. When a sub is used, their payment is calculated only for those dates, and the original trainer's payment is reduced accordingly.

## Current Architecture

- A `class_schedule` has one `trainer_id` and multiple `selected_dates` (e.g., 9 Saturdays in a term)
- `trainer_payments` has a UNIQUE constraint on `(trainer_id, class_schedule_id)` -- one payment record per trainer per schedule
- Payments are calculated at the schedule level, not per individual date

## Database Changes

### New table: `class_date_substitutes`

| Column | Type | Description |
|--------|------|-------------|
| id | uuid (PK) | |
| class_schedule_id | uuid (FK) | Links to the schedule |
| class_date | timestamptz | The specific date being substituted |
| substitute_trainer_id | uuid (FK) | The fill-in trainer (e.g., Michelle) |
| original_trainer_id | uuid (FK) | The regular trainer (e.g., Therese) |
| notes | text | Optional reason/notes |
| created_at | timestamptz | |

Unique constraint on `(class_schedule_id, class_date)` -- only one sub per date.

### Modify `trainer_payments` constraint

The existing UNIQUE constraint `(trainer_id, class_schedule_id)` already allows multiple trainers per schedule (since Michelle and Therese have different trainer IDs). No constraint changes needed.

## Payment Calculation Changes

When calculating trainer payment for a schedule:

1. Count total dates in the schedule's `selected_dates`
2. Count how many dates have substitutes in `class_date_substitutes`
3. Original trainer gets paid for: `(total_dates - sub_dates) / total_dates` of the commission
4. Substitute trainer gets paid for: `sub_dates / total_dates` of the commission

This applies proportionally to both percentage-based and fixed-fee arrangements.

## UI Changes

### 1. Substitute Trainer Assignment (Admin Class View)

On the class handlers/attendance page, add a "Substitute Trainer" button or section near the date columns. For each date in the schedule:

- Show the current trainer (default from schedule)
- Allow selecting a different trainer from a dropdown
- Show a visual indicator (icon/badge) when a date has a substitute

This will be integrated into the existing `HandlersTableContainer` or as a new row/section above the attendance grid.

### 2. Trainer Payment Report Adjustments

Update `formatTrainerData.ts` to:
- Fetch substitute data for all relevant schedules
- Pro-rate the commission for the original trainer (exclude sub dates)
- Include substitute schedules in the substitute trainer's payment data (even though the schedule's `trainer_id` points to someone else)

### 3. Retroactive Assignment

Since this uses a simple lookup table, you can assign substitutes to any past date. The UI will show all `selected_dates` for a schedule, including past ones, so you can set Michelle as the sub for dates she already covered.

## Implementation Sequence

1. **Database migration** -- Create `class_date_substitutes` table with RLS policies
2. **Substitute management UI** -- Add a dialog/section on the class detail page to assign subs per date
3. **Payment calculation updates** -- Modify `formatTrainerData.ts` and the `useTrainerPaymentData` hook to account for substitutions
4. **Edge function update** -- Update `update-trainer-payments` to handle sub trainer payment records
5. **Visual indicators** -- Show sub trainer name on attendance views and class detail pages

## Files to Create/Modify

**New files:**
- `supabase/migrations/[timestamp]_class_date_substitutes.sql` -- table + RLS
- `src/components/class-handlers/SubstituteTrainerDialog.tsx` -- UI for assigning subs per date

**Modified files:**
- `src/hooks/trainer-payments/useTrainerPaymentData.ts` -- fetch substitute data
- `src/hooks/trainer-payments/utils/formatTrainerData.ts` -- pro-rate payments
- `src/hooks/trainer-payments/queries/fetchTrainerData.ts` -- add substitute query
- `src/hooks/trainer-payments/types.ts` -- add substitute type
- `src/components/class-handlers/ClassHandlersTable.tsx` -- add sub trainer button/UI
- `supabase/functions/update-trainer-payments/index.ts` -- handle sub payments
- `src/components/class-handlers/table/HandlersTableContainer.tsx` -- show sub indicator on dates

