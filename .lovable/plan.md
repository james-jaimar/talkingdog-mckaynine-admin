
The user clarified Randburg Puppy is **session-count based**, not date-based. A handler buys 6 sessions and can attend any 6 dates — they're tracked by session number (1-6), not specific calendar dates. Once they hit session 6, they're done.

Currently the existing system already supports cycling 1→2→3→4→5→6 via `performance_grade` on `class_attendance` (see `AttendanceStatusCell.tsx` and the `randburg-numbered-sessions` memory). The recently-added `assigned_dates` logic (locking handlers to 6 specific calendar dates) directly contradicts this new understanding and needs to be undone.

What we actually need:
1. **Remove `assigned_dates` gating** — handlers can attend any date
2. **Track session count progression** — the number marked (1-6) represents which session they've completed, not a grade
3. **Auto-complete after session 6** — when admin marks "6", create a `handler_class_status` completion record + grey the row
4. **Keep email correct** — confirmation email should say "6 sessions" (not list specific dates) for Randburg Puppy

# Plan: Randburg Puppy — Session-Count Tracking (Not Date-Locked)

## What changes conceptually

For Randburg Puppy bookings:
- Handler buys **6 sessions** (no specific dates)
- Admin marks each attended date with a session number 1→6 (current cycle already does this)
- The session number = "which of their 6 sessions this is", incrementing across the term
- When session **6** is recorded, the handler is auto-marked complete and the row is greyed out
- Other dates remain available to mark (no `—` dashes), so admin can pick whichever dates the handler shows up to

## Step 1 — Undo date-locking from previous change

- **`addHandlerToClass.ts`**: Stop populating `assigned_dates` for Randburg Puppy bookings (leave column nullable, but unused going forward)
- **`BookingRow.tsx` / `MobileHandlerCard.tsx`**: Remove the "render dash if date not in assigned_dates" gating — every date cell becomes markable again
- **"Assigned: X of 6 sessions" indicator**: Replace with "**Sessions: X / 6**" computed from actual attendance records (count of `present` records with a `performance_grade` 1-6 for that booking in the current term)
- **`generateClassConfirmation.ts`**: Instead of using `assigned_dates`, hardcode the session count language for Randburg Puppy — e.g. "You're enrolled for 6 sessions. Sessions run weekly; your trainer will track your progress."
- **Backfill cleanup**: Optional — null out the `assigned_dates` we just wrote (or leave them; they'll be ignored)

## Step 2 — Auto-completion at session 6

In `AttendanceStatusCell.tsx` (and the equivalent mobile flow), after a successful `updateAttendance` call where the chosen value is `'6'`:
1. Insert a record into `handler_class_status` (handler_id = booking.client_id, dog_id, class_id, completed_at = now, class_type = 'puppy') — only if no completion record already exists for this dog+class
2. Invalidate `['handler-completion', ...]` and `['class-handlers', classId]` so the row re-renders as completed
3. Toast: "Puppy class completed — 6 of 6 sessions"

The existing `useMarkHandlersCompleted` logic shows the pattern; we'll do a lighter inline version per-booking.

## Step 3 — Visual "completed" state

In `BookingRow.tsx`:
- If `useHandlerCompletion` returns a record for this dog+class, apply muted styling (e.g. `opacity-60`, "Completed" badge next to handler name)
- Keep cells visible/markable in case admin needs to correct a mistake

In `MobileHandlerCard.tsx`: same — "Completed" badge + muted card.

## Step 4 — Session counter in handler row

Compute and display under the handler name (Randburg Puppy only):
```
Sessions: 4 / 6
```
Where the count = number of `class_attendance` rows for this booking with `attendance_status='present'` and `performance_grade IN ('1'..'6')`.

This replaces the misleading "Assigned: 4 of 6 sessions" indicator from the previous step.

## Files affected

- `src/components/classes/handlers/hooks/add-handler-modal/addHandlerToClass.ts` — remove `assigned_dates` write
- `src/components/class-handlers/BookingRow.tsx` — remove date-gating, add session counter + completed badge
- `src/components/class-handlers/mobile/MobileHandlerCard.tsx` — same
- `src/components/class-handlers/attendance/AttendanceStatusCell.tsx` — trigger completion on session 6
- `src/lib/email/generateClassConfirmation.ts` — Randburg Puppy email uses session-count copy, not date list
- `src/components/class-handlers/types/booking.ts` — keep `assigned_dates` (harmless, unused)

No DB migration needed — `class_attendance.performance_grade` already stores the session number.

## Out of scope

- Manually overriding which session number to record (admin still uses the cycle: tap to advance 1→2→…→6→absent→excused)
- Allowing more than 6 sessions (system stops at 6 and marks complete)
- Reopening a completed handler (admin can manually delete the `handler_class_status` row from the DB if needed)

## Memory update

After implementation, update `mem://features/attendance/randburg-numbered-sessions` to reflect: **session-count model, not date-locked**; auto-complete at 6.
