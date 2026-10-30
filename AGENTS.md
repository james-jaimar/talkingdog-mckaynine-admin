# Project rules

- Class creation and editing share ReportMonthField so month selection, clearing, and saved historical values behave consistently.
- Class report-month propagation runs atomically in the database, changes reporting metadata only, and preserves independent allocations and ambiguous invoices to avoid reallocating unrelated revenue.
- Invoice financial triggers run only on inserts or edits to financial inputs; reporting metadata changes must preserve stored totals, discounts, statuses, and InvoicesOnline details.
- Invoice edit item validation explicitly retains inventory codes and item types; imported invoice fees use the shared inventory metadata rules so validation and alternate creation paths cannot silently discard categorization.