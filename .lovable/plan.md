
# Fix Payment Receipt Data and Email Queue Attachment Preview

## Overview

Two issues need to be addressed:

1. **Payment receipts missing reference number and description** - The IO API is not receiving the invoice number and line item descriptions
2. **Email queue attachment preview** - Admins need to be able to preview/download PDF attachments when reviewing emails in the queue

---

## Issue 1: Payment Receipt Missing Reference Number and Description

### Root Cause

The `createIOPayment` function in `supabase/functions/sync-invoice-to-io/index.ts` only passes basic payment fields to the IO API. According to the IO API documentation, `GenerateNewPayment.php` accepts these optional fields that we're not using:

- **ReferenceNumber** (max 30 chars) - Should contain the invoice number
- **Description** (string) - Should contain a summary of what the payment is for

### Current Code (lines 299-307)

```typescript
const result = await callIOAPI("GenerateNewPayment.php", {
  username: credentials.username,
  password: credentials.password,
  ClientID: ioClientId,
  PaymentDate: paymentDate,
  PaymentAmount: invoice.total,
  PaymentMethod: "EFT",
  EmailToClient: false,
  // ReferenceNumber and Description are missing!
});
```

### Solution

Update `createIOPayment` to include:

1. **ReferenceNumber**: Pass the McKaynine invoice number (e.g., "McD-2602-0017")
2. **Description**: Build a summary from invoice items (e.g., "Group Class - Level 2 (Rex)")

**File to modify:** `supabase/functions/sync-invoice-to-io/index.ts`

```typescript
// Build description from invoice items
const description = invoice.items
  .map(item => item.description)
  .join("; ")
  .slice(0, 200); // IO might have a limit, keep it reasonable

const result = await callIOAPI("GenerateNewPayment.php", {
  username: credentials.username,
  password: credentials.password,
  ClientID: ioClientId,
  PaymentDate: paymentDate,
  PaymentAmount: invoice.total,
  PaymentMethod: "EFT",
  EmailToClient: false,
  ReferenceNumber: invoice.invoice_number.slice(0, 30), // Max 30 chars
  Description: description,
});
```

---

## Issue 2: Email Queue Attachment Preview

### Current Behavior

In `src/pages/admin/Email.tsx`, when viewing an email in the queue, attachments are displayed as badges showing only the filename. There's no way to actually view or download the attachment.

### Current Code (lines 426-434)

```tsx
{selectedEmail.attachments && selectedEmail.attachments.length > 0 && (
  <div>
    <span className="font-medium text-sm">Attachments:</span>
    <div className="flex gap-2 mt-1">
      {selectedEmail.attachments.map((att: any, idx: number) => (
        <Badge key={idx} variant="outline">{att.name || att.filename}</Badge>
      ))}
    </div>
  </div>
)}
```

### Solution

Add a download button for PDF attachments that converts the base64 content to a downloadable file:

**File to modify:** `src/pages/admin/Email.tsx`

```tsx
{selectedEmail.attachments && selectedEmail.attachments.length > 0 && (
  <div>
    <span className="font-medium text-sm">Attachments:</span>
    <div className="flex gap-2 mt-2 flex-wrap">
      {selectedEmail.attachments.map((att: any, idx: number) => {
        const filename = att.name || att.filename;
        const hasContent = att.content && att.encoding === "base64";
        
        const handleDownload = () => {
          if (!hasContent) return;
          
          try {
            // Convert base64 to blob
            const byteCharacters = atob(att.content);
            const byteNumbers = new Array(byteCharacters.length);
            for (let i = 0; i < byteCharacters.length; i++) {
              byteNumbers[i] = byteCharacters.charCodeAt(i);
            }
            const byteArray = new Uint8Array(byteNumbers);
            const blob = new Blob([byteArray], { type: att.contentType || 'application/pdf' });
            
            // Trigger download
            const link = document.createElement('a');
            link.href = URL.createObjectURL(blob);
            link.download = filename;
            link.click();
            URL.revokeObjectURL(link.href);
          } catch (error) {
            console.error("Error downloading attachment:", error);
            toast.error("Failed to download attachment");
          }
        };
        
        return (
          <Button
            key={idx}
            variant="outline"
            size="sm"
            className="gap-2"
            onClick={handleDownload}
            disabled={!hasContent}
          >
            <Paperclip className="h-4 w-4" />
            {filename}
            {hasContent && <Download className="h-3 w-3" />}
          </Button>
        );
      })}
    </div>
  </div>
)}
```

This gives admins the ability to:
- See which attachments are included
- Download and preview PDF attachments before the email is sent
- Verify the correct document is attached

---

## Summary of Changes

| File | Change |
|------|--------|
| `supabase/functions/sync-invoice-to-io/index.ts` | Add `ReferenceNumber` and `Description` to `createIOPayment` API call |
| `src/pages/admin/Email.tsx` | Add download functionality for email queue attachments |

---

## Technical Notes

### IO API Payment Fields (from official docs)

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| ClientID | int | Yes | IO client ID |
| PaymentDate | string | Yes | YYYY-MM-DD format |
| PaymentAmount | decimal | Yes | 9999.99 format |
| PaymentMethod | string | No | Defaults to "Cash" |
| ReferenceNumber | string | No | Max 30 chars |
| Description | string | No | Free text |
| EmailToClient | bool | No | We set false |

### Attachment Structure in Email Queue

Attachments are stored as JSON with this structure:
```json
{
  "filename": "invoice-McD-2602-0017.pdf",
  "content": "base64-encoded-string...",
  "encoding": "base64",
  "contentType": "application/pdf"
}
```
