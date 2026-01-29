
# Implement Credit Note on Invoice Deletion

## Overview

When an invoice is deleted from the McKaynine system, we need to ensure proper accounting by issuing a credit note in InvoicesOnline (IO) first. This will be handled in the `useDeleteInvoice` hook so all deletion paths are automatically covered.

## Approach

The safest architecture is to handle the IO sync directly in the `useDeleteInvoice` mutation hook. This ensures that:
- Every deletion path (from table actions or dialogs) goes through the same logic
- The credit note is issued before local deletion
- If credit note fails, we can warn the user but still allow local deletion (accounting should not block operations)

## Implementation Steps

### 1. Update `useIOSync.ts` to add credit note function

Add a new function to sync credit notes:

```typescript
export async function issueCreditNote(invoiceId: string): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    const { data, error } = await supabase.functions.invoke('sync-invoice-to-io', {
      body: {
        invoice_id: invoiceId,
        action: 'credit_note',
      },
    });
    
    if (error) return { success: false, error: error.message };
    if (data?.success) return { success: true };
    if (data?.skipped) return { success: true }; // Not synced to IO, nothing to credit
    return { success: false, error: data?.error || 'Unknown error' };
  } catch (err) {
    return { success: false, error: String(err) };
  }
}
```

### 2. Update `useDeleteInvoice.ts` mutation flow

Modify the deletion mutation to:

```typescript
mutationFn: async (invoiceId: string) => {
  // Step 1: Fetch invoice to check IO sync status
  const { data: invoice } = await supabase
    .from('invoices')
    .select('io_document_id, io_sync_status')
    .eq('id', invoiceId)
    .single();
  
  // Step 2: If synced to IO, issue credit note first
  if (invoice?.io_document_id) {
    console.log('[Delete] Invoice synced to IO, issuing credit note first');
    const creditResult = await issueCreditNote(invoiceId);
    
    if (!creditResult.success) {
      // Warn but don't block - local deletion should still proceed
      console.warn('[Delete] Credit note failed:', creditResult.error);
      toast.warning('IO credit note could not be issued', {
        description: creditResult.error,
      });
    } else {
      console.log('[Delete] Credit note issued successfully');
    }
  }
  
  // Step 3: Proceed with local deletion
  const { error } = await supabase
    .from('invoices')
    .delete()
    .eq('id', invoiceId);

  if (error) throw error;
  return { id: invoiceId };
}
```

### 3. Update success message

Change the success toast to indicate if a credit note was issued:

```typescript
onSuccess: (result, invoiceId) => {
  queryClient.invalidateQueries({ queryKey: ['invoices'] });
  toast.success("Invoice deleted successfully", {
    description: result.creditNoteIssued 
      ? "Credit note issued in InvoicesOnline" 
      : undefined
  });
  navigate('/invoices');
}
```

## Files to Modify

| File | Change |
|------|--------|
| `src/hooks/invoices/useIOSync.ts` | Add `issueCreditNote` function |
| `src/hooks/invoices/mutations/useDeleteInvoice.ts` | Update mutation to issue credit note before deletion |

## User Experience

1. User clicks "Delete" on an invoice
2. Confirmation dialog appears (existing behavior)
3. On confirm:
   - If invoice was synced to IO: Credit note is issued first, then local deletion
   - If invoice was NOT synced to IO: Direct local deletion
4. Success toast shows with credit note status
5. User is redirected to invoices list

## Edge Cases Handled

- **Invoice not synced to IO**: Skips credit note, proceeds with deletion
- **Credit note fails**: Shows warning toast but still deletes locally (accounting shouldn't block operations)
- **Invoice in test mode (skipped sync)**: Edge function returns `skipped`, treated as success
