
# Fix Report Month Override Not Displaying in Edit Form

## Problem

The `report_month_override` field is being saved correctly to the database (confirmed: `"2026-02"` exists for the Puppy Feb class), but when re-opening the Edit Class form, it shows "Auto (use schedule date)" instead of the saved value.

## Root Cause

The main class query in `src/components/classes/hooks/class-ordering/useClassQuery.ts` does not include `report_month_override`, `description`, or `branch_id` in its SELECT statement. When the Edit Class modal opens, it uses the cached class data from this query, which is missing these fields.

**Current query selects:**
```sql
id, name, class_type, course_fee, enrollment_fee, 
mckaynine_commission_type, mckaynine_commission_value,
admin_fee_type, admin_fee_value, trainer_fee_type, trainer_fee_value,
duration, capacity, branches(name), status, class_schedules(...)
```

**Missing fields:**
- `report_month_override` (the new field)
- `description`
- `branch_id`

## Solution

Add the missing fields to the SELECT statements in `useClassQuery.ts`. There are two query locations that need updating (lines 48-72 and lines 80-103).

---

## Files to Modify

| File | Change |
|------|--------|
| `src/components/classes/hooks/class-ordering/useClassQuery.ts` | Add `report_month_override`, `description`, and `branch_id` to both SELECT statements |

---

## Implementation

Update both SELECT statements to include:

```typescript
.select(`
  id, 
  name, 
  description,
  class_type,
  course_fee,
  enrollment_fee,
  mckaynine_commission_type,
  mckaynine_commission_value,
  admin_fee_type,
  admin_fee_value,
  trainer_fee_type,
  trainer_fee_value,
  duration,
  capacity,
  branch_id,
  report_month_override,
  branches(name),
  status,
  class_schedules(...)
`)
```

---

## Expected Outcome

After this fix:
1. The Edit Class form will correctly display the saved `report_month_override` value (e.g., "February 2026")
2. All class data including description will be properly loaded
3. The `branch_id` field will also be available for form pre-population
