
# Add Email Invoice to Dropdown + IO PDF Integration

## Overview

This is a comprehensive update to the invoice email workflow. Currently:
- Invoices sync to IO immediately when created (problematic for drafts)
- The email dialog generates a local PDF using jsPDF
- There's no "Email Invoice" option in the invoice table dropdown menu

We need to:
1. Add "Email Invoice" to the three-dot menu
2. Delay IO sync until the user actually emails the invoice
3. Fetch the PDF from IO (instead of generating locally)
4. Show progress during the multi-step process

## New Workflow

```text
User clicks "Email Invoice" on dropdown menu
    │
    ▼
[Progress Dialog Opens]
"Step 1/4: Syncing to InvoicesOnline..."
    │
    ├── Check if already synced to IO
    │   ├── YES: Skip to PDF fetch
    │   └── NO: Call sync-invoice-to-io edge function
    │           - Creates/finds IO client
    │           - Creates IO invoice with prefix (McD-YYMM-)
    │           - Creates IO invoice with correct date
    │           - Returns io_invoice_url
    │
    ▼
"Step 2/4: Generating PDF..."
    │
    ├── Call IO PDF download URL
    │   (or fallback to local jsPDF if IO fails)
    │
    ▼
"Step 3/4: Preparing email..."
    │
    ├── Convert PDF to base64
    │
    ▼
"Step 4/4: Ready!"
    │
    ▼
[Email Preview Dialog Opens]
    │
    └── User reviews, edits message, clicks Send
```

## Files to Modify

### 1. Edge Function: `sync-invoice-to-io/index.ts`

**Add `issued_date` to the data model and query:**
- Include `issued_date` in the SELECT query
- Add it to the `InvoiceData` interface

**Add prefix helper:**
```typescript
function getIOInvoicePrefix(branchId: string | null, invoiceDate?: string): string {
  const date = invoiceDate ? new Date(invoiceDate) : new Date();
  const yy = String(date.getFullYear()).slice(-2);
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  
  if (branchId === DELTA_BRANCH_ID) return `McD-${yy}${mm}-`;
  if (branchId === RANDBURG_BRANCH_ID) return `McR-${yy}${mm}-`;
  return `McK-${yy}${mm}-`;
}
```

**Update `createIOInvoice` API call:**
```typescript
const prefix = getIOInvoicePrefix(invoice.branch_id, invoice.issued_date);
const invoiceDate = new Date(invoice.issued_date).toISOString().split("T")[0];

const result = await callIOAPI("GenerateNewInvoice.php", {
  // ... existing params
  prepend_nr: prefix,      // McD-2602- or McR-2602-
  InvoiceDate: invoiceDate, // 2026-02-07 (from issued_date)
  data: data,
});
```

**Update `createIOCreditNote` similarly** for consistency.

**Add new action `get_pdf`:**
This fetches the PDF from the `io_invoice_url` stored when invoice was synced:
```typescript
if (action === "get_pdf") {
  if (!invoice.io_invoice_url) {
    return Response with error "Invoice not synced to IO yet"
  }
  
  // Fetch PDF from IO URL
  const pdfResponse = await fetch(invoice.io_invoice_url);
  const pdfArrayBuffer = await pdfResponse.arrayBuffer();
  const pdfBase64 = base64Encode(pdfArrayBuffer);
  
  return Response { success: true, pdf_base64: pdfBase64 }
}
```

### 2. Frontend Hook: `useIOSync.ts`

**Add new function for email workflow:**
```typescript
export async function syncAndGetPDF(
  invoiceId: string,
  onProgress: (step: number, message: string) => void
): Promise<{ success: boolean; pdfBase64?: string; error?: string }> {
  
  onProgress(1, "Syncing to InvoicesOnline...");
  
  // Step 1: Check if already synced, if not sync it
  const { data: invoice } = await supabase
    .from('invoices')
    .select('io_document_id, io_invoice_url')
    .eq('id', invoiceId)
    .single();
  
  if (!invoice?.io_document_id) {
    // Need to sync first
    const syncResult = await syncInvoiceToIO(invoiceId, 'invoice');
    if (!syncResult.success) {
      return { success: false, error: syncResult.error };
    }
  }
  
  onProgress(2, "Fetching PDF from InvoicesOnline...");
  
  // Step 2: Get PDF
  const { data, error } = await supabase.functions.invoke('sync-invoice-to-io', {
    body: { invoice_id: invoiceId, action: 'get_pdf' }
  });
  
  if (error || !data?.pdf_base64) {
    onProgress(3, "Using local PDF generation as fallback...");
    // Fallback to local PDF
    const localPdf = await getInvoiceAsBase64(invoice);
    return { success: true, pdfBase64: localPdf };
  }
  
  onProgress(4, "Ready!");
  return { success: true, pdfBase64: data.pdf_base64 };
}
```

### 3. Remove Immediate Sync: `createInvoiceUtils.ts`

Remove lines 165-168:
```typescript
// REMOVE THIS:
syncInvoiceToIO(invoice.id, 'invoice').catch(err => {
  console.error('[IO Sync] Background sync error on creation:', err);
});
```

Invoices will now stay as local drafts until emailed.

### 4. New Component: `EmailInvoiceProgressDialog.tsx`

A new dialog that shows progress while syncing to IO:

```typescript
interface EmailInvoiceProgressDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  invoice: Invoice;
  onReady: (pdfBase64: string) => void;
  onError: (error: string) => void;
}

export function EmailInvoiceProgressDialog({ ... }) {
  const [currentStep, setCurrentStep] = useState(0);
  const [stepMessage, setStepMessage] = useState("");
  
  useEffect(() => {
    if (open) {
      syncAndGetPDF(invoice.id, (step, message) => {
        setCurrentStep(step);
        setStepMessage(message);
      }).then(result => {
        if (result.success) {
          onReady(result.pdfBase64);
        } else {
          onError(result.error);
        }
      });
    }
  }, [open, invoice.id]);
  
  return (
    <Dialog open={open}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Preparing Invoice Email</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <Progress value={(currentStep / 4) * 100} />
          <p className="text-center text-muted-foreground">
            {stepMessage}
          </p>
          <div className="flex justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
```

### 5. Update: `InvoiceBasicActions.tsx`

Add "Email Invoice" menu item:

```typescript
import { Mail } from "lucide-react";

// Add state for email dialogs
const [emailProgressOpen, setEmailProgressOpen] = useState(false);
const [emailPreviewOpen, setEmailPreviewOpen] = useState(false);
const [preparedPdfBase64, setPreparedPdfBase64] = useState<string | null>(null);

const handleEmailInvoice = () => {
  onCloseDropdown();
  setEmailProgressOpen(true);
};

const handlePdfReady = (pdfBase64: string) => {
  setPreparedPdfBase64(pdfBase64);
  setEmailProgressOpen(false);
  setEmailPreviewOpen(true);
};

// In the JSX, add after Send Payment Receipt:
<DropdownMenuItem onClick={handleEmailInvoice} disabled={isPending}>
  <Mail className="mr-2 h-4 w-4 text-purple-600" /> Email Invoice
</DropdownMenuItem>

// Add dialogs at the end:
<EmailInvoiceProgressDialog
  open={emailProgressOpen}
  onOpenChange={setEmailProgressOpen}
  invoice={invoice}
  onReady={handlePdfReady}
  onError={(err) => {
    setEmailProgressOpen(false);
    toast.error(`Failed to prepare invoice: ${err}`);
  }}
/>

<EmailInvoicePreviewDialog
  open={emailPreviewOpen}
  onOpenChange={setEmailPreviewOpen}
  selectedInvoice={invoice}
  preparedPdfBase64={preparedPdfBase64}
/>
```

### 6. Update: `EmailInvoicePreviewDialog.tsx`

Accept pre-prepared PDF instead of generating locally:

```typescript
interface EmailInvoicePreviewDialogProps {
  // ... existing props
  preparedPdfBase64?: string | null; // NEW: Accept pre-prepared PDF
}

// In handleSendEmail, use preparedPdfBase64 if available:
const pdfBase64 = preparedPdfBase64 || await getInvoiceAsBase64(selectedInvoice);
```

### 7. Update: `useMarkInvoiceAsSent.ts`

Since email workflow now handles IO sync, we can optionally remove the duplicate sync here or keep it as a fallback for manual "Mark as Sent" actions.

**Option A (Recommended)**: Keep it - if someone manually marks as sent without emailing, it still syncs.

**Option B**: Remove it - only email triggers IO sync.

I recommend Option A for safety.

## Summary of All Changes

| File | Change |
|------|--------|
| `supabase/functions/sync-invoice-to-io/index.ts` | Add `issued_date`, prefix logic, `InvoiceDate` param, new `get_pdf` action |
| `src/hooks/invoices/useIOSync.ts` | Add `syncAndGetPDF` function with progress callbacks |
| `src/lib/invoices/createInvoiceUtils.ts` | Remove immediate `syncInvoiceToIO` call on creation |
| `src/components/invoices/dialogs/EmailInvoiceProgressDialog.tsx` | NEW: Progress dialog component |
| `src/components/invoices/table/actions/InvoiceBasicActions.tsx` | Add "Email Invoice" menu item and dialog handling |
| `src/components/invoices/dialogs/EmailInvoicePreviewDialog.tsx` | Accept `preparedPdfBase64` prop |

## User Experience

1. Ady drops handler into class - Invoice created locally (draft)
2. She can edit, add discounts, delete freely - no IO involvement
3. When ready, she clicks three-dots > "Email Invoice"
4. Progress dialog shows:
   - "Syncing to InvoicesOnline..." (creates invoice with correct date/prefix)
   - "Fetching PDF..." (downloads IO-generated PDF)
   - "Ready!"
5. Email preview opens with IO PDF attached
6. She reviews, edits message, clicks Send
7. Invoice status changes to "sent"

## Error Handling

- If IO sync fails: Show error, option to retry or use local PDF
- If PDF fetch fails: Fallback to local jsPDF generation
- Network timeouts: Progress dialog shows retry button after 30 seconds

## Technical Notes

- IO API returns `url` field with direct PDF download link
- The `prepend_nr` parameter accepts up to 9 characters (McD-2602- = exactly 9)
- The `InvoiceDate` parameter format is YYYY-MM-DD
- Progress is shown in 4 steps to give clear feedback during the 5-15 second process
