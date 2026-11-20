# Roadmap

- [x] Add course-fee discount explanations to the monthly franchise report and its PDF without changing financial calculations or Invoices Online.
- [x] Verify discount attribution (23 focused tests passed), inspect generated PDF layout, and check all sample rows on desktop/phone in light/dark with PDF downloads; keep the note readable within the horizontally scrolling phone table.
- [ ] Verify the signed-in franchise report screen; blocked by the external unmanaged backend, which provides no testing session.

- [x] Backfill nine confirmed missing October invoice inventory codes without changing financials or existing Invoices Online documents.
- [x] Trace creation, editing and sending paths; fix validation stripping codes and bulk import omitting codes. Class codes exist; individual edit history is not recorded, so no attribution to Ady is proven.
- [x] Verify backfill with protected-data assertions and eight passing focused tests. Signed-in screen checks remain unavailable for the external backend.

- [x] Move INV-McD-2610-0053–0058 to November without changing amounts or InvoicesOnline documents.
- [x] Add Report Month Override to class creation and synchronise existing single-class invoices when it changes.
- [x] Refresh invoice/report views after class edits and verify allocation rules with focused tests (21 app tests and five rollback-only database scenarios passed).
