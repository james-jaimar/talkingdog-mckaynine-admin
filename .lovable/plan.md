
Root cause is now confirmed with runtime evidence: your form is sending `termId = c795...` (Term 2), but the database is overwriting it to Term 1 at insert time.

What is happening:
1) Frontend submits correct payload (console shows `termId` is Term 2).
2) Row is inserted into `class_schedules` with `term_id = af8f...` (Term 1) anyway.
3) DB trigger `set_term_details_before_insert_update` runs `set_term_details_trigger()`.
4) That trigger always recalculates term from first selected date and forcibly sets `NEW.term_id`, overriding user selection.

Why the manual selector did not fix it:
- The selector works in UI.
- The backend trigger currently ignores manual selection and rewrites `term_id`.

Implementation plan (surgical, no more frontend guessing):
1) Patch database trigger logic (primary fix)
   - Update `public.set_term_details_trigger()` so:
     - If `NEW.term_id` is provided, keep it.
     - Derive `NEW.term_number` + `NEW.academic_year` from that `term_id` (join `terms` + `academic_years`).
     - Only fallback to date-based term inference when `NEW.term_id IS NULL`.
   - Keep backward compatibility for legacy inserts that don’t send `term_id`.

2) Add strict validation in trigger
   - If `NEW.term_id` is provided but invalid (no matching term), raise a clear exception.
   - Prevent silent bad writes.

3) Keep current frontend manual selector behavior
   - No new auto-detection logic.
   - Keep required `termId` in form schema and current warning UI for multi-term date ranges.

4) Add lightweight client/server observability
   - Keep/extend submission logs to include outgoing `termId`.
   - Add one debug log after insert/select in submit flow to confirm persisted `term_id` equals selected value (can be removed later).

5) Data repair for already-corrupted schedules
   - Run one SQL correction for existing rows wrongly set to Term 1.

Concrete DB change (core logic to implement):
- In trigger function:
  - `IF NEW.term_id IS NOT NULL THEN ... use NEW.term_id to set term_number/academic_year ... RETURN NEW; END IF;`
  - `ELSE ... existing first-date fallback ...`
- Do not overwrite `NEW.term_id` in the first branch.

Immediate one-time repair query (for your latest broken class):
```sql
UPDATE class_schedules
SET term_id = 'c7951cbb-de96-47b1-bf05-69b512b7f5da'
WHERE class_id = '5cf8a7a4-912a-4e3e-bc5e-6e31b59f8262'
  AND term_id = 'af8f86a4-6a26-4415-be4d-b388d7e942c1';
```

Acceptance criteria after fix:
- Creating/editing a schedule with manual Term 2 selected persists `term_id = Term 2` even if first date is in March.
- Multi-term warning still appears, but user choice is authoritative.
- No regression for legacy flows that omit `term_id` (fallback still works).
