
# Fix: Payment Sync Fails for Randburg (and Delta) - Response Parsing Bug

## Problem
When clicking "Mark as Paid", the IO payment API call succeeds, but the edge function returns a 500 error because it doesn't recognize the successful response format.

## Root Cause
The `createIOPayment` function checks for `r.url` or `r.invoice_nr` in the response, but the IO Payment API returns a different response structure:

**Actual IO Payment Response:**
```json
[{
  "type": "success",
  "message": "Payment 45 recorded successfully.",
  "PaymentNR": 45,
  "PaymentDate": "2026-02-01",
  "PaymentID": "2105593",
  "TotalAmount": "1755.00",
  "markedAsPaid": {"markedAsPaid": ["43"]}
}]
```

**Current Code (lines 296-310):**
```javascript
if (typeof result === "object" && result !== null) {
  const r = result as Record<string, unknown>;
  if (r.url || r.invoice_nr) {  // ❌ Payment has PaymentID, not url/invoice_nr
    return { success: true, url: String(r.url || "") };
  }
}
return { success: false, error: `Unexpected response: ...` };  // ❌ Falls through here
```

**Why It Fails:**
1. Response is an array, not a plain object
2. Success fields are `type: "success"` and `PaymentID`, not `url` or `invoice_nr`
3. Function returns "Unexpected response" error despite IO actually recording the payment

## Solution
Update `createIOPayment` to handle the array response format, similar to how `createIOInvoice` does.

### Fix for `createIOPayment`:

```javascript
async function createIOPayment(
  credentials: IOCredentials,
  ioClientId: number,
  invoice: InvoiceData
): Promise<{ success: boolean; paymentId?: string; url?: string; error?: string }> {
  console.log(`Recording IO payment for client ${ioClientId}, amount ${invoice.total}`);

  const paymentDate = invoice.payment_date 
    ? new Date(invoice.payment_date).toISOString().split("T")[0]
    : new Date().toISOString().split("T")[0];

  const result = await callIOAPI("GenerateNewPayment.php", {
    username: credentials.username,
    password: credentials.password,
    ClientID: ioClientId,
    PaymentDate: paymentDate,
    PaymentAmount: invoice.total,
    PaymentMethod: "EFT",
    EmailToClient: false,
  });

  // IO returns an array for payment responses
  if (Array.isArray(result) && result.length > 0) {
    const paymentInfo = result[0] as Record<string, unknown>;
    if (paymentInfo.type === "success" || paymentInfo.PaymentID) {
      console.log(`Payment recorded successfully: PaymentID=${paymentInfo.PaymentID}`);
      return {
        success: true,
        paymentId: String(paymentInfo.PaymentID || ""),
        url: "", // Payment API doesn't return a URL
      };
    }
    if (paymentInfo.error) {
      return { success: false, error: String(paymentInfo.error) };
    }
  }

  // Fallback: single object response
  if (typeof result === "object" && result !== null && !Array.isArray(result)) {
    const r = result as Record<string, unknown>;
    if (r.type === "success" || r.PaymentID || r.url) {
      return {
        success: true,
        paymentId: String(r.PaymentID || ""),
        url: String(r.url || ""),
      };
    }
    if (r.error) {
      return { success: false, error: String(r.error) };
    }
  }

  return { success: false, error: `Unexpected response: ${JSON.stringify(result)}` };
}
```

## Impact
- This bug affects **both Delta and Randburg** branches
- All payments are actually being recorded in IO correctly
- But the app shows an error and doesn't save the `io_payment_url` to the database
- Emails may not be sent correctly because the success callback isn't triggered properly

## Files to Modify
1. `supabase/functions/sync-invoice-to-io/index.ts`
   - Update `createIOPayment` function (lines 273-311)
   - Add array response parsing
   - Check for `type: "success"` or `PaymentID` fields

## Testing
1. Go to Randburg branch
2. Find or create an invoice that's been synced to IO
3. Click "Mark as Paid"
4. Should succeed without error
5. Check IO dashboard - payment should be recorded
6. Check email queue - payment receipt should be queued
