

# Fix Email Queue Attachment Download Button

## Problem

Eddie can see the PDF attachment reference in the email queue, but the download button is disabled and not clickable. This prevents her from previewing the attachment before sending.

## Root Cause

There's an **inconsistency in the attachment data structure** between different parts of the codebase:

| Source | Field for encoding | Field for MIME type |
|--------|-------------------|---------------------|
| `generatePaymentReceipt.ts` | ❌ None | `type: "application/pdf"` |
| `useEmailInvoice.ts` | `encoding: "base64"` | `contentType: "application/pdf"` |
| `Email.tsx` (checks) | `encoding === "base64"` | `contentType` |

The download button logic in `Email.tsx` (line 432):
```typescript
const hasContent = att.content && att.encoding === "base64";
```

Since payment receipts use `type` instead of `encoding`, the button is disabled.

## Solution

Update `Email.tsx` to handle both attachment formats:

1. Check for `encoding === "base64"` OR `type` containing "pdf" or similar
2. Use `contentType` OR `type` for the blob MIME type

### Code Change

**File:** `src/pages/admin/Email.tsx`

Update the attachment handling logic to be more flexible:

```typescript
// Current (broken for payment receipts):
const hasContent = att.content && att.encoding === "base64";

// Fixed (handles both formats):
const hasContent = att.content && (att.encoding === "base64" || att.type);
```

And for the blob creation:

```typescript
// Current:
const blob = new Blob([byteArray], { type: att.contentType || 'application/pdf' });

// Fixed (handles both formats):
const blob = new Blob([byteArray], { 
  type: att.contentType || att.type || 'application/pdf' 
});
```

## Bonus: Standardize Attachment Format

For long-term consistency, we should also update `generatePaymentReceipt.ts` to use the same format as `useEmailInvoice.ts`:

**File:** `src/lib/email/generatePaymentReceipt.ts`

Change from:
```typescript
{
  filename: `Payment_Receipt_${invoiceData.invoice_number}.pdf`,
  content: paymentPdfBase64,
  type: "application/pdf",
}
```

To:
```typescript
{
  filename: `Payment_Receipt_${invoiceData.invoice_number}.pdf`,
  content: paymentPdfBase64,
  encoding: "base64",
  contentType: "application/pdf",
}
```

## Files to Modify

| File | Change |
|------|--------|
| `src/pages/admin/Email.tsx` | Update attachment detection to handle both formats |
| `src/lib/email/generatePaymentReceipt.ts` | Standardize attachment format to use `encoding` and `contentType` |

## Expected Result

After these changes:
- The attachment download button will be **clickable** for all emails in the queue
- Eddie can preview PDFs before sending
- Both invoice and payment receipt attachments will work consistently

