

## The Full Picture

### Timeline

| When | What happened |
|---|---|
| Jan 3 – Mar 2 | Ady manually created 314 records in `handler_class_status` (the correct ones) |
| Before Mar 7 | Legacy data lived as free-text in `class_enrollments` (e.g., "91,5% Feb 2025", "Puppy Grad 23") |
| Mar 7 | Migration copied `class_enrollments` → `handler_class_status` as 450 `legacy_backfill` records. Many were wrongly marked "completed" |
| Today | We deleted all 450 `legacy_backfill` records. The 314 original records are untouched |

### The problem now

Handlers like Adam Sargent, Aileen Rodel, and Alexander Russell had their class history **only** in `class_enrollments` free-text. Ady never manually entered them into `handler_class_status`. The backfill was the only thing making their data show up — and now it's gone.

The `class_enrollments` source data still exists and is untouched. Examples:
- **Adam Sargent** (dog Fuji): Puppy = "DecJan 25", EO = "EO2 Feb 2025 91,5%"
- **Aileen Rodel** (dog Leia): Puppy = "Puppy Grad Mar 24", Yoga = "Jan 11th"
- **Alexander Russell** (dog Luna): Puppy = "Puppy Grad 23", EO = "Ages ago", Bronze = "Passed Dec 24", Beginner = "96,5% Jan 25"

### Proposed fix: Smarter re-import

Re-run the backfill but **only** for records where the free-text clearly indicates a real completion (has a percentage, "passed", "grad", or a clear date-based period). Skip vague notes like "info sent", "????", "join again??", scheduling notes, etc.

**Rules for the smarter import:**
1. Import if text contains a **percentage** (e.g., "91,5%") → status = passed/no_pass based on ≥60%
2. Import if text contains **"passed"** or **"grad"** → status = passed
3. Import if text contains **"did not grade"/"dng"** → status = did_not_grade
4. Import if text contains **"did not attend"/"dna"** → status = did_not_attend
5. Import if text contains **"no pass"/"fail"** → status = no_pass
6. **Skip everything else** — no more defaulting to "completed"
7. **Skip** if a `handler_class_status` record already exists for that handler + class_type + dog (don't overwrite Ady's manual work)

### Implementation

Single SQL migration that:
1. Re-reads `class_enrollments` source data
2. Applies the stricter parsing rules above
3. Only inserts where no existing record exists for that handler/class_type/dog
4. Tags new records as `completion_method = 'legacy_backfill_v2'` for traceability

This preserves all of Ady's manual work while restoring the clearly legitimate historical records.

