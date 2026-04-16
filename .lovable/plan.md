

# Fix: Randburg Puppy Roll-On/Roll-Off — 6 Sessions Per Handler

## Problem

The Randburg "Puppy April" class is a roll-on/roll-off setup. Ady keeps extending the schedule's `selected_dates` (currently 12 dates). When a new handler is added:

- The **class confirmation email** says "12 sessions" instead of 6
- The **handler attendance grid** shows 12 attendance columns instead of just the 6 the handler is enrolled for
- There's no way to define which 6 sessions a handler is committed to

For Randburg Puppy specifically, each handler enrols for **6 consecutive class dates** starting from their first session.

This affects ONLY Randburg Puppy classes. All other classes continue to use the full schedule.

## Approach

Store an explicit per-booking list of "assigned dates" so each handler has their own 6-date window, and use that list anywhere we display sessions for that handler.

### 1. Database

Add a new nullable column to `bookings`:
- `assigned_dates timestamptz[]` — null for normal classes; populated with 6 dates for Randburg Puppy bookings

(Nullable so it stays backwards compatible — non-Randburg classes ignore it entirely.)

### 2. Add Handler flow (`addHandlerToClass.ts`)

When inserting a new booking, detect if the class is Randburg Puppy (branch name + class type). If so:

1. Read `selected_dates` from the schedule
2. Find dates **>= today** (or >= the booking creation date)
3. Take the next **6** dates
4. Save them into `bookings.assigned_dates`

If fewer than 6 future dates exist (Ady hasn't extended yet), save what's available and flag a console warning so we can later prompt admin to extend.

### 3. Class handler attendance grid

In `useScheduleDates` and `ClassHandlersTable`, when the class is Randburg Puppy:

- Fetch the schedule's `selected_dates` for the column headers (so admin still sees all dates as columns)
- Per handler row, only render attendance cells for dates that exist in **that booking's `assigned_dates`**. Other date cells render as a muted dash (—) so it's visually clear they aren't part of that handler's 6 sessions

This keeps the table layout aligned across handlers but clearly shows each handler's window.

### 4. Confirmation email (`generateClassConfirmationEmails`)

When building the email for a Randburg Puppy booking:
- If the booking has `assigned_dates`, pass those into `formatClassDates()` instead of the schedule's full `selected_dates`
- Result: the email correctly shows "16 Apr - 21 May 2026 (6 sessions)" for that handler

### 5. Backfill existing handlers

Run a one-time data update for the current Randburg Puppy class (`9ea53fd3-…`):
- For each existing booking, compute the 6 dates starting from the first date >= the booking's `created_at` and write to `assigned_dates`

For Sandi Oosthuizen's booking just added today (16 Apr 2026), this will set 16 Apr → next 5 dates from the schedule.

### 6. UI affordance for admin (small)

On the Randburg Puppy class handlers page, add a small "Assigned: 6 of 6" indicator under each handler name so Ady can see at a glance how many sessions remain. Optional but very helpful for roll-on/roll-off.

## Files Changed

- `supabase/migrations/...` — add `bookings.assigned_dates` column
- `src/components/classes/handlers/hooks/add-handler-modal/addHandlerToClass.ts` — populate assigned_dates
- `src/components/classes/handlers/hooks/add-handler-modal/fetchClassDetails.ts` — already returns branch info; ensure branch name is available (or fetch it once in addHandler)
- `src/components/class-handlers/hooks/useClassHandlers.ts` — include `assigned_dates` in the booking select
- `src/components/class-handlers/BookingRow.tsx` + `MobileHandlersList.tsx` — render dash for dates not in assigned_dates (Randburg Puppy only)
- `src/lib/email/generateClassConfirmationEmails.ts` — use booking.assigned_dates when present
- One-off SQL backfill for existing Randburg Puppy bookings

## Out of scope

- Auto-extending Randburg's schedule when a handler's 6th date is the last available — Ady continues to add dates manually for now
- Allowing admin to manually override which 6 dates are assigned to a handler (could be a follow-up if needed)
- Changing how the trainer portal displays the date list (it already shows the schedule dates, which is fine for trainers)

