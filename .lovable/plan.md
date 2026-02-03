

# Fix IO Payment Receipt PDF Integration

## Problem Summary

You've identified that the payment receipt PDF from InvoicesOnline (IO) is **not being attached** when sending payment receipts. This affects:

1. **"Mark as Paid" automation** - Currently works (attachments are included)
2. **"Send Payment Receipt" manual action** - **BROKEN** (attachments missing from email queue insert)
3. **"Download PDF" button on invoice detail page** - Uses local PDF generator instead of IO PDF

Additionally, the "Download PDF" button should prioritize the official IO invoice PDF when available.

---

## Root Cause Analysis

### Issue 1: Manual "Send Payment Receipt" Missing Attachment

In `InvoiceBasicActions.tsx`, the `handleSendPaymentReceipt` function:
- Fetches the IO payment PDF correctly
- Passes it to `generatePaymentReceiptEmails` correctly
- The function returns `attachments` in the receipt data
- **BUT the email queue insert omits the `attachments` field**

Current broken code (lines 130-139):
```typescript
const { error: queueError } = await supabase
  .from("email_queue")
  .insert({
    branch_id: receiptData.branch_id,
    to_email: receiptData.to_email,
    subject: receiptData.subject,
    html_content: receiptData.html_content,
    handler_id: receiptData.handler_id,
    status: "pending",
    // MISSING: attachments: receiptData.attachments || null,
  });
```

Compare with working code in `useMarkInvoiceAsPaid.ts` (line 117):
```typescript
attachments: receiptData.attachments || null,
```

### Issue 2: Download PDF Uses Local Generator

In `InvoiceDetail.tsx` and `ClientInfoCard.tsx`:
- The "Download PDF" button always calls `generateInvoicePDF(invoice)` (local)
- Should check if `invoice.io_invoice_url` exists and fetch the official IO PDF

---

## Fix Details

### Fix 1: Add Missing Attachment Field

**File:** `src/components/invoices/table/actions/InvoiceBasicActions.tsx`

Add `attachments: receiptData.attachments || null` to the email_queue insert on line 138.

### Fix 2: Prioritize IO PDF for Download

**File:** `src/pages/InvoiceDetail.tsx`

Update `handleGeneratePDF` to:
1. Check if invoice has `io_invoice_url` (meaning it's synced to IO)
2. If yes, fetch the official PDF via `fetchIOPDF()` and trigger browser download
3. If no (draft invoice), fall back to local PDF generation

**File:** `src/components/invoices/detail/ClientInfoCard.tsx`

The `onGeneratePDF` prop is passed from `InvoiceDetail.tsx`, so no changes needed here.

---

## Implementation

### Step 1: Fix attachment field in InvoiceBasicActions.tsx

Add the missing `attachments` field to the email_queue insert so the IO receipt PDF is actually attached to emails.

### Step 2: Update handleGeneratePDF in InvoiceDetail.tsx

Modify the download logic to prefer IO PDF:
1. Import `fetchIOPDF` from the IO sync utilities
2. Check for `io_invoice_url` on the invoice
3. Fetch and download IO PDF if available
4. Fall back to local generation for draft invoices

---

## Expected Behavior After Fix

| Action | Before Fix | After Fix |
|--------|-----------|-----------|
| Mark as Paid (auto receipt) | Attaches IO PDF | No change (already works) |
| Send Payment Receipt (manual) | No attachment | Attaches IO PDF |
| Download PDF button | Local PDF always | IO PDF if synced, local if draft |

---

## Files to Modify

| File | Change |
|------|--------|
| `src/components/invoices/table/actions/InvoiceBasicActions.tsx` | Add `attachments` field to email_queue insert |
| `src/pages/InvoiceDetail.tsx` | Update `handleGeneratePDF` to prefer IO PDF |

