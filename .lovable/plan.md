

# Fix: Invoice Client Not Showing in Production

## Problem

`useClientById` is defined as a nested hook inside `useClientsData()`. This violates React's rules of hooks — hooks must be called at the top level of a component, not via dynamic function references returned from other hooks. It works in dev mode due to React's more lenient behavior but breaks in production builds where the reconciler is stricter.

## Fix

### `src/pages/InvoiceEdit.tsx`

Replace the `useClientById` call with a direct `useQuery` call:

```typescript
// Remove: const { clients, isLoading: clientsLoading, useClientById } = useClientsData();
// Remove: const { data: invoiceClient } = useClientById(invoice?.client_id);

// Replace with:
const { clients, isLoading: clientsLoading } = useClientsData();

const { data: invoiceClient } = useQuery({
  queryKey: ['client', invoice?.client_id],
  queryFn: async () => {
    const { data, error } = await supabase
      .from('clients')
      .select('*')
      .eq('id', invoice!.client_id)
      .single();
    if (error) throw error;
    return data;
  },
  enabled: !!invoice?.client_id,
});
```

Add `useQuery` import from `@tanstack/react-query` and `supabase` import. The `allClients` merge logic stays the same.

One file, ~5 lines changed.

