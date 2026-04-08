
Do I know what the issue is? Yes.

## What I confirmed
- `INV-McD-2603-0058` still has a valid `client_id` in the database, and the Benjamin client record exists. So this is not data corruption.
- `InvoiceEdit.tsx` already fetches the invoice with joined client data via `useInvoiceDetails()`.
- The page still depends on a second client-hydration path (`useClientsData` + extra `useQuery`) to make the dropdown show the label.
- The current form init uses a one-time `isLoaded` guard, which makes the client field brittle if the invoice or linked client resolves after the first reset.

## Actual problem
The edit form is treating the client dropdown as if it only knows the selected client once that client appears in the dropdown options.

That is the wrong source of truth here.

For edit mode, the authoritative source is the invoice itself:
- the invoice already knows `client_id`
- the invoice query already includes the joined client record

So even if the bulk client list is limited or late, the selected client should still be shown and kept in the form.

## Fix plan

### 1) Make `InvoiceEdit.tsx` use the invoice’s joined client as the primary selected client
- Build the selected client from `invoice.client` first
- Only use the direct `invoiceClient` query as a fallback if `invoice.client` is missing
- Merge `[invoice.client, invoiceClient, ...clients]` into one deduped options list

This removes the dependency on the 200-client list for the active invoice.

### 2) Remove the one-shot `isLoaded` hydration pattern
In `src/pages/InvoiceEdit.tsx`:
- remove the `isLoaded` gate
- reset the form whenever the loaded invoice changes
- always set `client_id` from `invoice.client_id` during reset

This ensures the form value is actually populated, not just the invoice number/dates.

### 3) Render the selected client label explicitly in the Select trigger
Instead of relying only on Radix discovering the selected item text from async-loaded options:
- look up the selected client from the merged options list
- render that name directly in the trigger when `field.value` exists

This guarantees Ady sees Benjamin immediately, even if the option list hydrates later.

### 4) Keep the constrained-list pattern, but make it production-safe
Do not remove the global `.limit(200)` from `useClientsData`.
Instead:
- keep the bulk list lightweight
- hydrate the specific linked client for edit mode only
- dedupe by `id`

That matches the existing app pattern for records outside the default fetch window.

## File to update
### `src/pages/InvoiceEdit.tsx`
Planned changes:
- remove `isLoaded`
- use invoice client as primary source
- merge and dedupe client options
- explicitly show selected client text in the Select trigger
- keep direct client fetch only as fallback, not as the main dependency

## Small polish
Benjamin appears to have his full name stored in `first_name` with an empty `last_name`, so use a trimmed name formatter (`[first_name, last_name].filter(Boolean).join(" ")`) for the dropdown and trigger label.

## QA to verify after implementation
1. Open `INV-McD-2603-0058` directly in edit mode
2. Confirm Benjamin shows in the client field before touching the dropdown
3. Save without re-selecting the client
4. Test one invoice whose client is inside the first 200 and one outside the first 200
5. Verify the published site specifically, not only preview

This should fix both symptoms:
- client name not showing
- save being blocked because the form thinks no client is selected
