
Goal
- Fix “Email Invoice” flashing then disappearing by ensuring the dialogs are not mounted inside (and therefore destroyed by) the Radix DropdownMenu lifecycle.
- Add deeper, end-to-end visibility so that if IO/network issues happen, the user sees a stable dialog with an actionable error instead of a flash.

What’s actually happening (root cause)
- `InvoiceBasicActions` is rendered inside `<DropdownMenuContent>` (see `src/components/invoices/table/InvoiceTableActions.tsx`).
- `InvoiceBasicActions` currently renders BOTH:
  - `EmailInvoiceProgressDialog`
  - `EmailInvoicePreviewDialog`
- When you click a dropdown item, Radix closes the dropdown. Closing the dropdown unmounts `DropdownMenuContent` and all children inside it.
- That unmount destroys the dialog components immediately. The dialog “opens” for a frame (flash), then disappears because its component is gone, not because of outside-click handlers.
- This also explains why the edge function can return `200 OK` while you still see “flash then nothing”: the backend call may continue, but the UI that should display progress is already unmounted.

High-level solution
- Lift the “Email Invoice” dialog state and dialog components OUTSIDE the dropdown menu content, into a stable parent that does not unmount when the dropdown closes.
- Keep the dropdown action item as a trigger only (it calls a callback).
- Reuse the pattern already used elsewhere (the dialog is rendered outside a small trigger area), e.g. in `src/components/invoices/InvoicesList.tsx` and `src/components/invoices/detail/ClientInfoCard.tsx`, where `EmailInvoicePreviewDialog` is mounted outside transient UI.

Implementation plan (frontend)

1) Refactor ownership of the Email Invoice workflow to a stable parent
- Target file: `src/components/invoices/table/InvoiceTableActions.tsx`
- Add state in `InvoiceTableActions` for:
  - `emailProgressOpen: boolean`
  - `emailPreviewOpen: boolean`
  - `preparedPdfBase64?: string`
  - `selectedInvoiceForEmail?: Invoice` (or `Invoice | null`)
- Render the dialogs at the bottom of `InvoiceTableActions` (sibling to the DropdownMenu, not inside it):
  - `<EmailInvoiceProgressDialog open={emailProgressOpen} ... invoice={selectedInvoiceForEmail} ... />`
  - `<EmailInvoicePreviewDialog open={emailPreviewOpen} selectedInvoice={selectedInvoiceForEmail} preparedPdfBase64={preparedPdfBase64} ... />`
- Important: `EmailInvoiceProgressDialog` currently requires `invoice: Invoice` (non-null). We will either:
  - Option A (preferred): Update `EmailInvoiceProgressDialog` prop type to accept `invoice: Invoice | null` and render nothing / no-op if null.
  - Option B: Guard rendering: only render the dialog components when `selectedInvoiceForEmail` is non-null, and pass it as `invoice`.

2) Change `InvoiceBasicActions` to become a “pure actions list” (no dialogs)
- Target file: `src/components/invoices/table/actions/InvoiceBasicActions.tsx`
- Remove local state:
  - `emailProgressOpen`, `emailPreviewOpen`, `preparedPdfBase64`
- Remove rendering of `EmailInvoiceProgressDialog` and `EmailInvoicePreviewDialog` from this component entirely.
- Replace `handleEmailInvoice` logic with a callback prop:
  - Add prop: `onEmailInvoice: (invoice: Invoice) => void`
  - On click: `onCloseDropdown(); onEmailInvoice(invoice);`
- Keep other actions unchanged.

3) Wire the action callback from parent to child
- Target file: `src/components/invoices/table/InvoiceTableActions.tsx`
- When rendering `InvoiceBasicActions`, pass:
  - `onEmailInvoice={(inv) => { ... }}`
- In that handler:
  - Close dropdown (you already do with `onCloseDropdown`, but ensure parent doesn’t reopen it)
  - Set `selectedInvoiceForEmail = inv`
  - Reset `preparedPdfBase64 = undefined`
  - Ensure preview is closed: `setEmailPreviewOpen(false)`
  - Open progress dialog on next tick (safe timing):
    - `setTimeout(() => setEmailProgressOpen(true), 0)`
  - This reuses your prior “defer open” trick, but now it will actually work because the dialog won’t be unmounted.

4) Keep the current “progress -> preview” transition, but move it to the parent
- The parent should own the “PDF ready” transition because it owns dialog state now.
- In `InvoiceTableActions` implement:
  - `handlePdfReady(pdfBase64)`:
    - `setPreparedPdfBase64(pdfBase64)`
    - `setEmailProgressOpen(false)`
    - `setTimeout(() => setEmailPreviewOpen(true), 100)`
  - `handleEmailError(msg)`:
    - `setEmailProgressOpen(false)`
    - show toast error
- Pass these handlers into `EmailInvoiceProgressDialog`.

5) Make the progress dialog robust if it gets closed mid-flight
- Target file: `src/components/invoices/dialogs/EmailInvoiceProgressDialog.tsx`
- Add an “isMounted” guard so the async `startSync()` doesn’t try to set state after unmount (common in StrictMode and transient UI):
  - Inside `useEffect`, track a `let cancelled = false;` and check before setting state / calling `onReady`.
- This prevents weird “flash” side effects and silent React warnings; it doesn’t fix the flash by itself, but it makes the overall workflow stable.

6) Improve observability for the “network errors / elevated error rates” case (without overcomplicating)
- When the edge function returns `200 OK` but includes `{ success: false, error: ... }`, we should surface that clearly in the progress dialog rather than only toasts.
- Ensure `syncAndGetPDF` error messages are preserved and displayed in the dialog (`errorMessage` already exists).
- Add a small “Copy error details” button in the error state (optional, but useful for your debugging).
- This way, even if Lovable/Supabase/IO are having a bad day, the user sees a stable modal with a concrete error and retry controls.

Backend / IO considerations (what we will verify, but not over-change)
- Since you see `200 OK`, the immediate issue is UI lifecycle, not a failing HTTP request.
- After the UI fix, we’ll re-check whether `sync-invoice-to-io` is sometimes returning `{ skipped: true }` (TEST_MODE) which triggers local PDF fallback, or returning `{ success: false }` with an error.
- We will also verify CORS headers in `supabase/functions/_shared/cors.ts` are sufficient for any custom headers being sent, but given `200 OK`, this is likely not the blocker for the “flash” symptom.

Validation / Testing checklist (end-to-end)
1) From invoices table, click “…” → “Email Invoice”
   - Expected: dropdown closes, progress dialog stays open.
2) Confirm progress dialog advances through steps and does not disappear.
3) Confirm:
   - Success path: progress closes → preview dialog opens with editable content and PDF attachment available.
   - Error path: progress dialog stays open and shows error with Retry/Cancel; does not vanish.
4) Try on:
   - Desktop (mouse)
   - Mobile/touch (Radix “interact outside” behavior can differ)
5) Confirm no new console warnings about state updates on unmounted components.

Files expected to change
- `src/components/invoices/table/InvoiceTableActions.tsx` (new state + render dialogs + pass callback)
- `src/components/invoices/table/actions/InvoiceBasicActions.tsx` (remove dialog rendering, add `onEmailInvoice` prop)
- `src/components/invoices/dialogs/EmailInvoiceProgressDialog.tsx` (optional but recommended: mount guards / cancellation)
- Potentially update any types if needed (minimal changes).

Why this “different angle” will work
- It stops fighting Radix outside-click timing and instead fixes the actual cause: component unmounting.
- Once dialogs live outside the dropdown, they cannot be destroyed by dropdown close, so “flash then nothing” will become either a stable progress UI or a stable error UI.
