

## Duplicate Cleanup Plan

### What I Found

Three categories of duplicates in `handler_class_status`:

**Category 1: Dog-ID vs NULL duplicates (5 records to remove)**
Records where Ady manually re-entered data without a dog_id, duplicating an existing record that already has a dog_id. Same handler, class_type, percentage, and period.

| Handler | Class | % | Remove (no dog_id) |
|---|---|---|---|
| Angela Glover | EO | 81.5% | `82711e3d` (manual, no dog) |
| Angela Glover | EO | 61% | `588225b8` (manual, no dog) |
| Duncan Miller | Beginner | 64.5% | `76361e7c` (manual, no dog) |
| Jackie Dickson | Novice | 70.5% | `452116e5` (manual, no dog) |
| Michael Rogans | EO | 91.5% | `785ca41a` (manual, no dog) |

Action: Delete the 5 NULL-dog records. The ones with dog_id are more complete.

**Category 2: Pure NULL-NULL duplicates (6 records to remove)**
Yoga entries where Ady double-clicked, creating two identical records within 1-2 seconds. Both have NULL dog_id, same period, same everything.

| Handler | Periods | Dupes |
|---|---|---|
| Allison Gilbert | Jan 26, Feb 26, Mar 26 | 3 pairs |
| Joy Tupholme / Sharise Smith | Jan 26, Feb 26, Mar 26 | 3 pairs |

Action: Delete the later-created record from each pair (6 records).

**Category 3: Multi-dog backfill_v2 records (9 records -- keep as-is)**
These are `legacy_backfill_v2` records for a *different dog* than the existing record. These represent legitimate separate completions for handlers with multiple dogs (e.g., Peter and Kathy Solomon have two dogs that each completed classes). These are NOT duplicates -- they are distinct dog records.

### Implementation

Single data cleanup deleting **11 specific records** by ID:
- 5 NULL-dog duplicates (Category 1)
- 6 double-click Yoga duplicates (Category 2)

No code changes needed. No schema changes. Just targeted DELETE by ID.

