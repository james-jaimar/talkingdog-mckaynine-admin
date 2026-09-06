# Correct trainer invoice allocation at its source

## Verified diagnosis

- Benjamin McNally’s three paid invoices are already labelled correctly at invoice level: all three have **Term 3, 2026**, with report months **July, August, and September**.
- The incorrect field is each invoice line’s booking link:
  - July points to Benjamin’s Term 3 Working Trials booking.
  - August points to his old Term 2 booking.
  - September points to his old Term 1 booking.
- The PDF and screenshot therefore show Benjamin only once when the normal trainer report loads Term 3 bookings.
- The manual “create invoice from bookings” flow currently offers old bookings as unpaid based only on `proof_of_payment`, and then trusts whichever booking was selected. It does not enforce that the selected booking belongs to the invoice’s reporting term.
- The previous date-scoped statement change bypassed the normal term-based report instead of correcting these bad booking links, so it did not fix the underlying data.

## Implementation

1. **Repair Benjamin’s two incorrect links**
   - Change only the August and September Working Trials invoice lines to reference Benjamin’s existing Term 3 Working Trials booking.
   - Leave the invoice numbers, amounts, statuses, report months, dates, and the two older unlinked drafts unchanged.

2. **Prevent future cross-term links when creating invoices**
   - Scope the booking choices in the manual booking-to-invoice flow to the active term.
   - Before submission, validate that every selected booking belongs to the same term used by the invoice; stop with a clear message if not.
   - Keep the invoice report month and invoice `term_id` aligned through the existing month-to-term database rule.

3. **Restore the statement to the normal financial-report source**
   - Remove the separate all-term statement fetch introduced by the unsuccessful fix.
   - Use the trainer report’s Term 3 data as the statement source again.
   - Keep the date picker functional by filtering those correctly allocated invoice rows by `franchise_report_month`, falling back to invoice date only when the report month is absent.
   - Ensure preview, downloaded PDF, and emailed statement all use the same filtered rows and totals.

4. **Regression coverage and verification**
   - Add tests for rejecting a booking whose schedule term differs from the invoice term.
   - Add a statement test covering three invoice lines on one Term 3 booking with July, August, and September report months.
   - Verify Steve McClean’s statement for **1 July–6 September 2026** shows Benjamin three times at **R720 course fee / R288 commission each**, while August-only shows one row.
   - Verify the generated PDF matches the on-screen statement.

## Technical scope

- Frontend booking selection and validation.
- Focused database data correction for the two identified invoice items; no schema change, reset, deletion, or older migration reapplication.
- Trainer statement data wiring and tests only.
