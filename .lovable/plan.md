

# Wire-In Audit: Randburg Puppy Session-Count Model

After the session-count refactor, several other surfaces still treat the schedule's `selected_dates.length` as the handler's session count — so a Randburg Puppy handler appears to be enrolled in 12 sessions instead of 6 across emails, the customer portal, and reports.

## Findings & fixes

### 1. Class confirmation email subject — already fixed ✅
`generateClassConfirmation.ts` correctly emits "6 sessions — attend any 6…" in the body. No change needed.

### 2. Customer portal — "My Classes" page (`src/pages/customer/CustomerClasses.tsx`)
**Problem**: Shows "Upcoming Sessions" listing dates from `selected_dates`, plus a "+9 more" badge — handler sees all 12 schedule dates.
**Fix**: When the booking's class is Randburg Puppy, replace the "Upcoming Sessions" date pills with a session-count summary:
- "**6 sessions** — attend any 6 of the available class dates"
- Show their progress: "**X of 6 sessions completed**" (count `class_attendance` rows with `performance_grade IN ('1'..'6')` for this booking)
- Hide the date pills entirely for this class type

### 3. Customer enrollment invitation page (`src/pages/customer/CustomerClassEnrollment.tsx`)
**Problem**: When a handler clicks an invitation link for Randburg Puppy, the page lists every date in `selected_dates` (e.g. "Saturday, Jan 18 • Saturday, Jan 25 • …" up to 12 entries) and shows the class's `duration` weeks badge.
**Fix**: For Randburg Puppy invitations:
- Replace `formatClassDates()` output with: "**6 sessions** — attend any 6 scheduled class dates"
- Replace the `{duration} weeks` badge with a "**6 sessions**" badge

### 4. SendQuickEmailModal prebuilt template variables (`src/components/handlers/detail/SendQuickEmailModal.tsx`)
**Problem**: Prebuilt info-pack templates (Puppy, EO3) auto-populate a `class_dates` variable with the date range. For Randburg Puppy this would inject "18 Jan - 22 Mar 2026 (12 sessions)".
**Fix**: When the resolved booking is Randburg Puppy, override the auto-populated `class_dates` value with: "**Roll-on/roll-off — 6 sessions, attend any 6 scheduled dates**". (The user can still edit it manually if they want.)

### 5. Class invitation creation (info-pack/follow-up emails generated automatically)
**Problem**: `ClassClosureModal` and any flow that auto-generates an info-pack task for Randburg Puppy will inherit the schedule's full date range when rendered.
**Fix**: When the target class is Randburg Puppy, have the info-pack generation use the session-count copy in the `class_dates` slot. (Same helper as #4.)

### 6. Attendance counter in admin UI ("Attendance: X / Y")
**Problem**: `useClassesListData.ts` and `useFranchiseClassesData.ts` compute `totalClasses = selected_dates.length` (= 12 for Randburg Puppy). This drives the "Attendance: 4 / 12" display in `ClassesListReport` and the franchise PDF — misleading for Randburg Puppy handlers.
**Fix**: When the class is Randburg Puppy, override `totalClasses` to **6**. The displayed value becomes "Attendance: 4 / 6", aligned with the session-count model. (Franchise revenue calculations are unaffected — they use invoice amounts, not session counts.)

### 7. Helper utility for "is Randburg Puppy"
**Add**: A small shared helper `isRandburgPuppyClass(branchName, classType)` in `src/lib/classes/randburgPuppy.ts` so the same detection logic isn't duplicated across the 6 sites above. Currently this check is inline in 4+ places (confirmation email, AttendanceStatusCell, BookingRow, MobileHandlerCard, TrainerClassDetail).

## Out of scope

- The trainer portal date list (`TrainerClassDetail.tsx`) — trainers genuinely need to see all dates so they can pick one to take attendance against. No change there.
- Franchise revenue / trainer payment calculations — they don't depend on session count, only on invoiced amounts.
- Backfilling old confirmation emails or invitations already sent — only future comms are affected.

## Files affected

- `src/lib/classes/randburgPuppy.ts` (new helper)
- `src/pages/customer/CustomerClasses.tsx`
- `src/pages/customer/CustomerClassEnrollment.tsx`
- `src/components/handlers/detail/SendQuickEmailModal.tsx`
- `src/components/classes/closure/ClassClosureModal.tsx` (if it touches `class_dates` variable on info-pack tasks; verify during implementation)
- `src/hooks/useClassesListData.ts`
- `src/hooks/useFranchiseClassesData.ts`
- Refactor existing inline checks in `generateClassConfirmation.ts`, `AttendanceStatusCell.tsx`, `BookingRow.tsx`, `MobileHandlerCard.tsx`, `TrainerClassDetail.tsx` to use the new helper

No DB migration needed.
