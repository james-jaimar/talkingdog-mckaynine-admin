# Project rules

- Class creation and editing share ReportMonthField so month selection, clearing, and saved historical values behave consistently.
- Class report-month propagation runs atomically in the database, changes reporting metadata only, and preserves independent allocations and ambiguous invoices to avoid reallocating unrelated revenue.
- Invoice financial triggers run only on inserts or edits to financial inputs; reporting metadata changes must preserve stored totals, discounts, statuses, and InvoicesOnline details.