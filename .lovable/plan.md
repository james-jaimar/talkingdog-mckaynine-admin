

# Fix "Send Payment Receipt" to Ensure IO Payment Sync

## Problem

The "Send Payment Receipt" manual action fetches the IO payment PDF, but **doesn't check whether the payment has been synced to IO first**. If the invoice was marked as paid but the IO sync failed or wasn't triggered, the `io_payment_url` will be empty and the PDF fetch will fail.

The correct workflow should be:
1. Check if the invoice is synced to IO (has `io_document_id`)
2. If not, sync the invoice first
3. Check if the payment is synced to IO (has `io_payment_url`)
4. If not, sync the payment first
5. Then fetch the payment PDF
6. Proceed with emailing

---

## Current vs Expected Flow

| Step | Current Flow | Expected Flow |
|------|--------------|---------------|
| 1 | Check offline mode | Check offline mode |
| 2 | Fetch payment PDF directly | Check if invoice is synced to IO |
| 3 | - | If not, sync invoice to IO |
| 4 | - | Check if payment is synced to IO |
| 5 | - | If not, sync payment to IO |
| 6 | - | Fetch payment PDF from IO |
| 7 | Continue with email | Continue with email |

---

## Solution

Update `handleSendPaymentReceipt` in `InvoiceBasicActions.tsx` to follow the same pattern as `useMarkInvoiceAsPaid.ts`:

### Changes to InvoiceBasicActions.tsx

```typescript
const handleSendPaymentReceipt = async () => {
  onCloseDropdown();
  setIsSendingReceipt(true);
  
  try {
    toast.info("Preparing payment receipt...");
    
    let paymentPdfBase64: string | undefined;
    
    // Check if IO offline mode is enabled
    const isOfflineMode = await getIOOfflineModeFromDB();
    
    if (!isOfflineMode) {
      // Step 1: Check if invoice is synced to IO
      const { data: invoiceData } = await supabase
        .from('invoices')
        .select('io_document_id, io_payment_url')
        .eq('id', invoice.id)
        .single();
      
      // Step 2: If invoice not synced, sync it first
      if (!invoiceData?.io_document_id) {
        toast.info("Syncing invoice to InvoicesOnline...");
        const invoiceSyncResult = await syncInvoiceToIO(invoice.id, 'invoice');
        
        if (!invoiceSyncResult.success && !invoiceSyncResult.skipped) {
          console.warn('[Send Receipt] Invoice sync failed:', invoiceSyncResult.error);
          // Continue without IO - email will still send, just without attachment
        }
      }
      
      // Step 3: If payment not synced, sync it first
      if (!invoiceData?.io_payment_url) {
        toast.info("Syncing payment to InvoicesOnline...");
        const paymentSyncResult = await syncInvoiceToIO(invoice.id, 'payment');
        
        if (!paymentSyncResult.success && !paymentSyncResult.skipped) {
          console.warn('[Send Receipt] Payment sync failed:', paymentSyncResult.error);
          // Continue without IO - email will still send, just without attachment
        }
      }
      
      // Step 4: Fetch IO payment PDF
      toast.info("Fetching receipt from InvoicesOnline...");
      const pdfResult = await fetchIOPaymentPDF(invoice.id);
      
      if (pdfResult.success && pdfResult.pdfBase64) {
        paymentPdfBase64 = pdfResult.pdfBase64;
        console.log('[Send Receipt] IO payment PDF fetched successfully');
      } else {
        console.warn('[Send Receipt] Could not fetch IO payment PDF:', pdfResult.error);
      }
    } else {
      console.log('[Send Receipt] IO offline mode - skipping PDF fetch');
    }
    
    // Continue with email generation...
  }
  // ... rest of function
};
```

---

## Files to Modify

| File | Change |
|------|--------|
| `src/components/invoices/table/actions/InvoiceBasicActions.tsx` | Add invoice/payment sync checks before fetching PDF |

---

## Required Imports

Add `syncInvoiceToIO` to the existing import from `useIOSync`:

```typescript
import { fetchIOPaymentPDF, getIOOfflineModeFromDB, syncInvoiceToIO } from "@/hooks/invoices/useIOSync";
```

---

## Regarding Local PDF Repository

You mentioned storing the IO PDF in "our repository". Currently:

- **Invoice PDFs**: The `io_invoice_url` is stored in the database. Each time the PDF is needed, it's fetched fresh from IO.
- **Payment PDFs**: The `io_payment_url` is stored in the database. Same fresh fetch pattern.

There's **no local caching** of the actual PDF files. If you want to implement PDF caching (e.g., store in Supabase Storage), that would be a separate enhancement. For now, the system relies on IO being available to serve the PDFs on demand.

---

## Summary

This fix ensures that when you click "Send Payment Receipt":
1. If the invoice isn't synced to IO yet - sync it
2. If the payment isn't synced to IO yet - sync it  
3. Then fetch the official IO payment receipt PDF
4. Attach it to the email

This mirrors the logic already working in the "Mark as Paid" automation.

