# Make the trainer statement period actually filter the statement

## What I found

Benjamin McNally's last three invoices are correct: Aug 24 (R720), Jul 29 (R720) and Jul 10 (R720) are each linked to the 15h00 Working Trials class with Steve McClean, so the commission is being attributed to Steve. Two older drafts (May R720, June R480) have no class linked — leaving those alone for now.

The statement period picker in the Generate Statement dialog is display-only. It changes the heading, the "Statement Period" line, the emailed summary and the PDF filename, but the class list and the totals are still whatever the term/month selection behind the dialog produced. The dialog even says so in small print.

## The change

The picker becomes a real filter, based on **the month each invoice is reported in** (the report month Ady sets on the invoice). So for Steve, picking 1–31 August includes Benjamin's August R720 and excludes the July and September ones, even though they all come from the same ongoing Working Trials class.

Behaviour:

- Choosing a From/To date range re-filters the classes shown in the preview and recalculates Total earned / Paid / Outstanding from only the amounts whose invoice report month falls inside the range.
- A class with no qualifying amounts in the range drops off the statement entirely.
- Per-handler lines inside a class show only the amounts inside the range, so an ongoing monthly payer shows one line per month rather than the whole term lumped together.
- The PDF, the on-screen preview, the emailed summary and the filename all use the filtered figures.
- "Reset" returns to the full selection, and the small "display only" note is removed.
- Invoices with no report month set fall back to their invoice date so nothing silently disappears; those rows are marked in the preview so Ady can spot and fix them.

## Technical notes

- `fetchAllInvoiceItems` (`src/hooks/trainer-payments/queries/fetchTrainerData.ts`) additionally selects `invoices.franchise_report_month` and `invoices.issued_date`; `InvoiceItem["invoices"]` in `src/hooks/trainer-payments/types.ts` gains both fields.
- `canonicalCommission.ts` carries a `periodKey` (`YYYY-MM`, from `franchise_report_month` falling back to `issued_date`) plus a `periodInferred` flag onto each `CanonicalCommissionLine`, so no commission maths changes — only metadata is added.
- `formatTrainerData.ts` keeps the raw lines available per schedule: each `bookingsDetails` entry gains a `periodBreakdown` array of `{ periodKey, courseFee, commissionAmount, isPaid, periodInferred }`, and each class detail gains the union of its period keys.
- `TrainerStatementDialog.tsx` derives `periodFrom`/`periodTo` into an inclusive set of `YYYY-MM` keys and applies it in `filteredClassDetails`, `recalculatedTotals` and `prepareClassData`, summing only matching `periodBreakdown` entries. Everything already flows from those three, so the preview, PDF, email and filename pick the change up automatically.
- Existing schedule-selection filtering (`selectedScheduleIds`) still applies first; the period filter narrows further.
- No database or commission-rule changes.
