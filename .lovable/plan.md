

# Fix: Invoice Edit Not Showing Client

## Problem
The client dropdown on the Edit Invoice page shows "Select client" instead of the actual client (Benjamin McNally for INV-McD-2603-0058). This happens because `useClientsData` fetches only the first 200 clients (`.limit(200)`), but there are 360 clients in the system. If the invoice's client falls outside that window, the Select component can't match the value to any option.

## Fix

### `src/pages/InvoiceEdit.tsx`
Two changes:

1. **Remove the `.limit(200)` dependency** — instead of relying on the generic `useClientsData` hook (which caps at 200), fetch the invoice's client directly and ensure it's always in the list.

2. **Add the invoice's client to the dropdown if missing** — after both the invoice and client list load, check if `invoice.client_id` exists in the `clients` array. If not, fetch it individually and prepend it to the list.

Concrete approach:
- Import `useClientById` from `useClientsData` (already exposed)
- Call `useClientById(invoice?.client_id)` to fetch the specific client
- In the Select rendering, ensure the invoice's client appears in the options even if it's not in the main list
- This is a minimal, non-breaking change — no other pages affected

### No changes to `useClientsData.ts`
The 200 limit is a reasonable performance guard for other pages. We only need to guarantee the current invoice's client is visible on the edit page.

## Technical Detail
```
// In InvoiceEdit.tsx, after existing hooks:
const { useClientById } = useClientsData();
const { data: invoiceClient } = useClientById(invoice?.client_id);

// When rendering Select options, merge:
const allClients = useMemo(() => {
  if (!clients) return invoiceClient ? [invoiceClient] : [];
  if (invoiceClient && !clients.find(c => c.id === invoiceClient.id)) {
    return [invoiceClient, ...clients];
  }
  return clients;
}, [clients, invoiceClient]);
```

One file changed, ~10 lines added.

