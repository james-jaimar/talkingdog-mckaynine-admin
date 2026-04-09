

# Fix: Substitute Trainer Dashboard & Wrong Class Dates

## Two bugs

### Bug 1: Dashboard shows zeros
**TrainerDashboard.tsx** (lines 79, 140) only queries `class_schedules` where `trainer_id = trainerProfile.id`. Nadia is a substitute, not a primary trainer, so she gets zero classes, zero students, zero earnings. Same pattern already fixed in TrainerClasses.tsx needs to be applied here.

### Bug 2: Classes show wrong date (Friday instead of Saturday)
The `selected_dates` in the database are stored as timestamps like `2026-04-10 22:00:00+00` — this is midnight SAST (UTC+2) on **April 11** (Saturday). But `combineDateWithTime` in `scheduleOccurrences.ts` extracts the **UTC date** (April 10, Friday) and combines it with the **UTC time** (12:00), creating `2026-04-10T12:00:00Z`. When `date-fns format()` renders this in local time, it shows Friday April 10 at 14:00 — correct time, wrong day.

**Root cause**: The utility uses `getUTCFullYear/Month/Date/Hours/Minutes` and `Date.UTC()`, but these dates and times represent local values stored with UTC offsets. The fix is to use local date/time methods instead.

Additionally, line 222 in TrainerClasses.tsx shows end_time as `format(new Date(schedule.end_time), "HH:mm")` — this uses the raw `end_time` timestamp (from the first occurrence) rather than computing the end time relative to `displayDate`. This should calculate end time by adding the duration to `displayDate`.

## Files to change

### 1. `src/utils/scheduleOccurrences.ts`
- Change `extractTimeParts` to use `getHours()`/`getMinutes()` instead of `getUTCHours()`/`getUTCMinutes()`
- Change `combineDateWithTime` to use `getFullYear()`/`getMonth()`/`getDate()` and `new Date(year, month, date, hours, minutes)` instead of UTC equivalents

This makes the function treat timestamps as local time — which matches how `date-fns format()` renders them.

### 2. `src/pages/trainer/TrainerDashboard.tsx`
- Add substitute class fetching (same pattern as TrainerClasses.tsx):
  - Query `class_date_substitutes` for this trainer's schedule IDs
  - Fetch those extra schedules and merge them
- Add substitute schedule IDs to the earnings query so those payments are included in dashboard stats

### 3. `src/pages/trainer/TrainerClasses.tsx`
- Fix line 222: compute end time as `displayDate + (end_time - start_time)` duration instead of using raw `end_time` timestamp

## Technical detail

```text
// scheduleOccurrences.ts — before:
function extractTimeParts(isoString) {
  const date = new Date(isoString);
  return { hours: date.getUTCHours(), minutes: date.getUTCMinutes() };
}
function combineDateWithTime(dateIso, timeIso) {
  // uses getUTCFullYear/Month/Date and Date.UTC(...)
}

// after:
function extractTimeParts(isoString) {
  const date = new Date(isoString);
  return { hours: date.getHours(), minutes: date.getMinutes() };
}
function combineDateWithTime(dateIso, timeIso) {
  const datePart = new Date(dateIso);
  const timeParts = extractTimeParts(timeIso);
  return new Date(
    datePart.getFullYear(), datePart.getMonth(), datePart.getDate(),
    timeParts.hours, timeParts.minutes, 0, 0
  );
}
```

This is safe because `date-fns format()` already uses local time — the two now align.

