

## Investigation Results: Incorrect Handler Class Completion Data

### What Happened

On **March 7**, a migration (`20260307135341`) ran a "legacy backfill" that converted free-text data from the old `class_enrollments` table into structured records in `handler_class_status`. This was part of moving from hardcoded class types to the dynamic system.

**The migration created 450 records**, and this is the root cause of the incorrect data.

### Why It's Wrong

The `class_enrollments` table columns (`puppy_class`, `eo_class`, `bronze_cgc_class`, etc.) were **free-text fields used as admin notes** — not structured completion records. They contained all sorts of values:

- **Admin scheduling notes**: `"15h00 info sent Jan 11th 25"`, `"14h00 EO April 25"`, `"Enrolled April 25"`
- **Gibberish/shorthand**: `"a"`, `"HD"`, `"HD Puppy"`, `"McRandburg"`, `"????"`
- **Excel date serial numbers**: `"45739"`, `"45830"`, `"45952"`, `"46014"`
- **Personal notes**: `"did not want to continue"`, `"Cash flow issues, next time"`, `"Doing Chemo, might look at Sep 25"`
- **Status notes that aren't completions**: `"info sent"`, `"Bronze info sent"`, `"Join again??"`, `"Break Apr May 25"`

The migration's fallback logic (lines 110-111) treated **any unrecognized value as `"completed"`** status. So 348 out of 450 backfilled records got marked as "completed" — including all the admin notes above.

**This means handlers are showing as having completed classes they never took.**

### What Ady Has Done Since

Ady has been manually adding correct records (completion_method = `"manual"`) since March 7, including today (March 17). She's added ~271 manual records. Some of these may now **duplicate** or **conflict** with the incorrect backfill records.

### The Fix

The backfill data is identifiable: all 450 records have `completion_method = 'legacy_backfill'`. The safest approach:

1. **Delete all `legacy_backfill` records** from `handler_class_status` — they are unreliable and the source data (admin free-text notes) was never meant to represent structured completion data
2. **Preserve all manual and other records** — these are the ones Ady and the system have correctly created
3. **Verify no orphaned `handler_tasks`** reference deleted status records

### Implementation

| Step | Action |
|---|---|
| 1 | Run SQL migration: `DELETE FROM handler_class_status WHERE completion_method = 'legacy_backfill'` (450 records) |
| 2 | Clean up any `handler_tasks` that reference deleted `handler_class_status` IDs via `class_status_id` |
| 3 | No code changes needed — the display code (`useHandlersData.ts`) already works correctly with the dynamic class types |

### Risk Assessment

- **Low risk**: The backfill records are clearly identifiable and separable from real data
- **Ady's manual corrections are safe**: They use `completion_method = 'manual'` and won't be touched
- **Some handlers may lose legitimate historical data**: A few backfill records (like those with real percentages: `"81% Dec 24"`, `"88,5% Sep 24"`) were correctly parsed. But since Ady has been re-entering correct data manually, and the source data was unreliable, it's safer to remove all backfill and let Ady verify

