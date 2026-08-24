# Editable statement period on trainer statements

Ady pays some trainers monthly, not per term. Today the statement heading and "Statement Period" line are taken from the global term selector (`Term 3, 2026` / term start–end dates), so a statement built from only the August Yoga classes still reads "Term 3, 01 Jul – 30 Sep". She needs to control that text. It is display-only: it does not change which classes or amounts are included.

## What changes

In the Generate Statement dialog, add a small "Statement period" editing area above the preview with:

1. **Period label** (free text) — what prints as the big heading, e.g. "August 2026" or "Term 3, 2026".
2. **From / To dates** — what prints on the "Statement Period: …" line.
3. A **Reset to selected classes** action.

Smart defaults, applied each time the dialog opens:

- From / To default to the earliest and latest class dates among the classes actually selected (so picking the two August Yoga classes gives 01 Aug – 01 Aug, and the label defaults to "August 2026").
- If the selected classes span more than one month, the label defaults to e.g. "Aug – Sep 2026".
- If nothing is selected (all classes), fall back to today's behaviour: the term label and the term date range.

A quick month picker sits next to the label so she can snap the period to a whole calendar month (1st–last day) in one click.

Everything downstream — the on-screen preview, the PDF, the emailed HTML summary, the email subject, and the PDF filename — uses the edited values instead of the term values.

## Technical notes

- `TrainerStatementDialog.tsx` holds new local state `periodLabel`, `periodFrom`, `periodTo`, seeded by a `useEffect` on `open` from the min/max of `filteredClassDetails` dates (`classDate`/`scheduleDate`/`start_time`), falling back to the `termInfo` and `dateRange` props.
- Replace the current pass-through of `termInfo` / `dateRange` into `TrainerStatementHTMLPreview`, `generateTrainerStatementPDF`, and `TrainerStatementEmailDialog` with the state values. No changes needed inside `TrainerStatementPDF.tsx` or `generateTrainerStatementEmail.ts` — they already take `termInfo` and `dateRange` as params.
- Date inputs use the shadcn Popover + Calendar pattern with `pointer-events-auto` so they work inside the dialog.
- `TrainerPaymentsSummary.tsx` keeps supplying the term-derived defaults; no data-fetching or commission logic is touched.
