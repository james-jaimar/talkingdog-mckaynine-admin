
# Fix Payment Receipt PDF Attachment

## Problem Identified
The InvoicesOnline `GenerateNewPayment.php` API does not return a URL to download the payment receipt PDF. Our code currently stores an empty string for `io_payment_url`, which causes the PDF fetch to fail silently.

**Evidence from logs:**
- Payment API response: `{"type":"success","PaymentNR":251,"PaymentID":"2105611","TotalAmount":"1755.00"...}` - No URL returned
- Invoice API response includes: `{"url":"https://www.invoicesonline.co.za/scripts/Download.php?type=invoice&id=2652779&bid=8978&did=239"...}` - URL is returned

## Solution
Construct the payment PDF URL ourselves using the returned `PaymentID` and `PaymentNR`, following the same pattern as invoice URLs.

**Invoice URL pattern:**
`https://www.invoicesonline.co.za/scripts/Download.php?type=invoice&id={document_id}&bid={business_id}&did={invoice_nr}`

**Payment URL pattern (to construct):**
`https://www.invoicesonline.co.za/scripts/Download.php?type=payment&id={PaymentID}&bid={business_id}&did={PaymentNR}`

## Implementation Changes

### 1. Edge Function: Update `createIOPayment()` to construct the URL

In `supabase/functions/sync-invoice-to-io/index.ts`:

```javascript
async function createIOPayment(
  credentials: IOCredentials,
  ioClientId: number,
  invoice: InvoiceData,
  businessId: string  // Add this parameter
): Promise<{ success: boolean; paymentId?: string; paymentNr?: number; url?: string; error?: string }> {
  // ... existing code ...

  if (Array.isArray(result) && result.length > 0) {
    const paymentInfo = result[0] as Record<string, unknown>;
    if (paymentInfo.type === "success" || paymentInfo.PaymentID) {
      const paymentId = String(paymentInfo.PaymentID || "");
      const paymentNr = Number(paymentInfo.PaymentNR || 0);
      
      // Construct the payment receipt PDF URL
      const paymentUrl = paymentId && paymentNr && businessId
        ? `https://www.invoicesonline.co.za/scripts/Download.php?type=payment&id=${paymentId}&bid=${businessId}&did=${paymentNr}`
        : "";
      
      console.log(`Payment recorded successfully: PaymentID=${paymentId}, URL=${paymentUrl}`);
      return {
        success: true,
        paymentId,
        paymentNr,
        url: paymentUrl,
      };
    }
  }
  // ...
}
```

### 2. Edge Function: Pass business ID to createIOPayment

The business ID is needed to construct the URL. We can get it from the IO credentials lookup or store it as a constant.

```javascript
// Business IDs for each branch (from IO account settings)
const IO_BUSINESS_ID_DELTA = "8978";  // From the log: bid=8978
const IO_BUSINESS_ID_RANDBURG = "XXXX"; // Need to determine

function getIOBusinessId(branchId: string | null): string {
  if (branchId === DELTA_BRANCH_ID) return IO_BUSINESS_ID_DELTA;
  if (branchId === RANDBURG_BRANCH_ID) return IO_BUSINESS_ID_RANDBURG;
  return "";
}

// In the payment action handler:
const businessId = getIOBusinessId(invoiceData.branch_id);
const result = await createIOPayment(credentials, ioClientId, invoiceData, businessId);
```

### 3. Store additional payment fields in the database

Update the payment action response to store the payment ID for reference:

```javascript
if (result.success) {
  await supabase
    .from("invoices")
    .update({
      io_sync_status: "payment_synced",
      io_sync_error: null,
      io_synced_at: new Date().toISOString(),
      io_payment_url: result.url,  // Now contains the constructed URL
      io_payment_id: result.paymentId,  // Store for reference
    })
    .eq("id", invoice_id);
}
```

## Files to Modify

| File | Changes |
|------|---------|
| `supabase/functions/sync-invoice-to-io/index.ts` | Update `createIOPayment()` to construct PDF URL, add business ID constants |

## Database Changes (Optional)
Add `io_payment_id` column to invoices table to store the IO payment ID for reference.

## Testing
1. Mark a test invoice as paid (e.g., for jimmybhawkins@gmail.com who is in the test list)
2. Check that `io_payment_url` is populated with the constructed URL
3. Verify the payment receipt email has the PDF attachment
4. Confirm the PDF downloads correctly from the constructed URL

## Notes
- We need to determine the Randburg branch business ID from IO (Delta is 8978 based on logs)
- If the URL pattern doesn't work for payments, we can fall back to using the `GetClientHistory.php` API to fetch the payment links
