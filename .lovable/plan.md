
# Fix: Send Payment Receipt Should Use IO Payment PDF

## Problem
When you manually click "Send Payment Receipt" from the invoice actions menu, the email doesn't include the official InvoicesOnline payment receipt PDF. However, when you "Mark as Paid", the automatic email correctly includes the IO PDF.

## Root Cause
In `InvoiceBasicActions.tsx`, the `handleSendPaymentReceipt` function calls:
```javascript
const receiptsData = await generatePaymentReceiptEmails(invoice.id);
```

But `generatePaymentReceiptEmails` accepts an optional second parameter for the payment PDF:
```javascript
export async function generatePaymentReceiptEmails(
  invoiceId: string,
  paymentPdfBase64?: string  // <-- This is never passed from manual send!
)
```

The "Mark as Paid" flow correctly fetches and passes the IO PDF, but the manual "Send Payment Receipt" action doesn't.

## Solution
Update `handleSendPaymentReceipt` in `InvoiceBasicActions.tsx` to:

1. Check if IO offline mode is enabled
2. If online, fetch the payment PDF from IO using `fetchIOPaymentPDF()`
3. Pass the PDF to `generatePaymentReceiptEmails()`

### Changes to `InvoiceBasicActions.tsx`

```javascript
import { fetchIOPaymentPDF, getIOOfflineModeFromDB } from "@/hooks/invoices/useIOSync";

const handleSendPaymentReceipt = async () => {
  onCloseDropdown();
  setIsSendingReceipt(true);
  
  try {
    toast.info("Preparing payment receipt...");
    
    let paymentPdfBase64: string | undefined;
    
    // Check if IO offline mode is enabled
    const isOfflineMode = await getIOOfflineModeFromDB();
    
    if (!isOfflineMode) {
      // Fetch IO payment PDF
      toast.info("Fetching receipt from InvoicesOnline...");
      const pdfResult = await fetchIOPaymentPDF(invoice.id);
      
      if (pdfResult.success && pdfResult.pdfBase64) {
        paymentPdfBase64 = pdfResult.pdfBase64;
        console.log('[Send Receipt] IO payment PDF fetched successfully');
      } else {
        console.warn('[Send Receipt] Could not fetch IO payment PDF:', pdfResult.error);
        // Continue without PDF - the email template still works
      }
    } else {
      console.log('[Send Receipt] IO offline mode - skipping PDF fetch');
    }
    
    toast.info("Generating payment receipt(s)...");
    
    // Pass the IO PDF to the email generator
    const receiptsData = await generatePaymentReceiptEmails(invoice.id, paymentPdfBase64);
    
    // ... rest of existing code
  }
};
```

## Technical Details

### Current Flow (broken)
```text
Click "Send Payment Receipt"
  -> generatePaymentReceiptEmails(invoiceId)  // No PDF passed
  -> Email queued without IO PDF attachment
```

### Fixed Flow
```text
Click "Send Payment Receipt"
  -> Check IO offline mode
  -> If online: fetchIOPaymentPDF(invoiceId)
  -> generatePaymentReceiptEmails(invoiceId, paymentPdfBase64)
  -> Email queued WITH IO PDF attachment
```

## Files to Modify
1. `src/components/invoices/table/actions/InvoiceBasicActions.tsx`
   - Import `fetchIOPaymentPDF` and `getIOOfflineModeFromDB` from useIOSync
   - Update `handleSendPaymentReceipt` to fetch IO PDF before generating emails

## Testing Checklist
1. Mark an invoice as paid (to ensure payment is synced to IO)
2. Click the dropdown menu → "Send Payment Receipt"
3. Check toast shows "Fetching receipt from InvoicesOnline..."
4. Check the queued email in email_queue has an attachments entry
5. When email is sent, verify the IO PDF is attached
6. Test with IO offline mode enabled - should skip PDF fetch gracefully
