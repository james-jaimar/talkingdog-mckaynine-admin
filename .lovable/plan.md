# Make trainer statement dates load and show every matching invoice

## Confirmed cause

The generated PDF proves the date fields changed while the figures did not. The database confirms Benjamin McNally has three paid R720 invoices reported in July, August, and September 2026, all allocated to Steve McClean's 15h00 Working Trials class. They sit on three separate schedule records assigned to Terms 3, 2, and 1.

The Trainers screen currently loads schedules only for the globally selected term before the statement opens. The statement dialog can filter only that already-limited data, so changing its dates cannot bring the other two schedules into the statement. It also combines invoice amounts into one handler row per booking, instead of showing each monthly invoice separately.

## Change

- Give the statement dialog its own fetch-on-demand query for the selected trainer, branch, and statement date range, independent of the globally selected term.
- Filter invoice lines by `franchise_report_month`, falling back to `issued_date` only when the report month is missing.
- Rebuild the statement preview from those matching invoice lines and their linked bookings/schedules, while preserving trainer commission rules, discounts, paid status, branch isolation, and substitute allocation.
- Group matching schedules with the same class name into one class section, but retain one handler line per invoice/reporting month. Benjamin will therefore appear three times for July–September, each as R720 course fee and R288 commission.
- Show the reporting month on each handler line so repeated monthly payments are distinguishable.
- Make date changes refresh the preview and totals immediately; PDF generation and email will use the same loaded data.
- Keep the statement label editable and keep Reset restoring the initial range.

## Verification

- Add focused tests for inclusive month-range filtering, report-month precedence, invoice-date fallback, repeated invoices for one handler, and cent-safe totals.
- Verify Steve McClean's 1 July–6 September 2026 statement contains Benjamin's three entries and totals R864 commission for him.
- Verify narrowing to August shows only Benjamin's August R720 / R288 entry, and that the downloaded PDF matches the on-screen preview.

## Technical notes

- Use a dedicated React Query key containing trainer ID, branch ID, and inclusive `YYYY-MM` bounds; fetch only while the statement is open.
- Query the required schedules, bookings, invoice items, invoices, and payment/substitute metadata in bounded batches rather than widening the main Trainers report query across every term.
- Introduce an invoice-line statement shape with a stable invoice-item key and report month; do not aggregate it by booking before rendering.
- No database migration or financial rule change is required.
