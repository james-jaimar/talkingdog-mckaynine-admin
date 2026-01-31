
# Strict IO PDF Mode with Explicit Offline Switch

## The Problem

Currently, the system silently falls back to local PDF generation when IO PDF fetch fails:

```typescript
// Current behavior in syncAndGetPDF (lines 203-206)
if (!pdfResult.success || !pdfResult.pdfBase64) {
  onProgress(3, "IO PDF unavailable, using local generation...");
  return { success: true, pdfBase64: undefined }; // Quietly fallback
}
```

And in `EmailInvoicePreviewDialog` (lines 120-124):
```typescript
if (!pdfBase64) {
  console.log("No pre-prepared PDF, generating locally...");
  pdfBase64 = await getInvoiceAsBase64(selectedInvoice); // Silent fallback
}
```

This means errors with IO get hidden, and you might not realize you're sending locally-generated PDFs instead of the official IO ones.

## The Solution

1. **Create an explicit IO_OFFLINE toggle** - When `true`, use local PDF. When `false`, IO is required
2. **Remove silent fallbacks** - If IO is online and fails, show an error. Don't quietly use local
3. **Add clear messaging** - User knows exactly which mode they're in

## Where to Store the Setting

**Option A: Database setting (recommended)**
- Add a `system_settings` table with `io_offline_mode` boolean
- Can be toggled via an admin settings page

**Option B: Environment variable**
- Add `IO_OFFLINE_MODE` as a secret/env var in the edge function
- Requires deployment to change

**Option C: Code constant (quick & simple)**
- Add `IO_OFFLINE_MODE = false` constant in `useIOSync.ts`
- Easy to toggle during development but requires code change

I recommend **Option A** for production use, but we can start with **Option C** for immediate implementation and migrate to Option A later.

## Implementation

### 1. Add IO Mode Configuration

In `src/hooks/invoices/useIOSync.ts`, add a configuration constant:

```typescript
/**
 * IO Mode Configuration
 * When IO_OFFLINE_MODE is true, the system uses local PDF generation
 * When false (default), the system REQUIRES IO PDF - no silent fallback
 */
export const IO_OFFLINE_MODE = false;
```

### 2. Update `syncAndGetPDF` - No More Silent Fallback

```typescript
export async function syncAndGetPDF(
  invoiceId: string,
  onProgress: (step: number, message: string) => void
): Promise<{ success: boolean; pdfBase64?: string; error?: string; useLocalPdf?: boolean }> {
  
  // If IO is explicitly offline, signal to use local PDF
  if (IO_OFFLINE_MODE) {
    onProgress(1, "IO offline mode - using local PDF generation...");
    return { success: true, useLocalPdf: true };
  }
  
  onProgress(1, "Checking InvoicesOnline sync status...");
  
  // ... existing sync logic ...
  
  onProgress(2, "Fetching PDF from InvoicesOnline...");
  
  const pdfResult = await fetchIOPDF(invoiceId);
  
  // CHANGED: No more silent fallback - if IO fails, return error
  if (!pdfResult.success || !pdfResult.pdfBase64) {
    return { 
      success: false, 
      error: pdfResult.error || 'Failed to fetch PDF from InvoicesOnline. Please retry or enable IO Offline Mode.' 
    };
  }
  
  onProgress(4, "Ready!");
  return { success: true, pdfBase64: pdfResult.pdfBase64 };
}
```

### 3. Update Progress Dialog to Handle Local PDF Mode

In `EmailInvoiceProgressDialog.tsx`, handle the `useLocalPdf` flag:

```typescript
if (result.success) {
  if (result.useLocalPdf) {
    // IO offline mode - need to generate PDF locally
    setStepMessage("Generating local PDF...");
    const localPdf = await getInvoiceAsBase64(invoice);
    onReady(localPdf);
  } else {
    onReady(result.pdfBase64);
  }
}
```

### 4. Remove Fallback from Email Dialog

In `EmailInvoicePreviewDialog.tsx`, remove the silent fallback:

```typescript
// BEFORE:
let pdfBase64 = preparedPdfBase64;
if (!pdfBase64) {
  console.log("No pre-prepared PDF, generating locally...");
  pdfBase64 = await getInvoiceAsBase64(selectedInvoice);
}

// AFTER:
if (!preparedPdfBase64) {
  throw new Error("No PDF available. Please go back and retry.");
}
const pdfBase64 = preparedPdfBase64;
```

## New Behavior Matrix

| IO_OFFLINE_MODE | IO Sync Result | PDF Fetch Result | Outcome |
|-----------------|----------------|------------------|---------|
| `true` | Skipped | Skipped | Uses local jsPDF |
| `false` | Success | Success | Uses IO PDF |
| `false` | Success | **Fails** | **Error shown** (no fallback) |
| `false` | **Fails** | N/A | **Error shown** (no fallback) |

## Files to Modify

| File | Change |
|------|--------|
| `src/hooks/invoices/useIOSync.ts` | Add `IO_OFFLINE_MODE` constant, remove silent fallback, add `useLocalPdf` return flag |
| `src/components/invoices/dialogs/EmailInvoiceProgressDialog.tsx` | Handle `useLocalPdf` flag, generate local PDF when in offline mode |
| `src/components/invoices/dialogs/EmailInvoicePreviewDialog.tsx` | Remove silent fallback, require `preparedPdfBase64` |

## Future Enhancement (Optional)

Once this is working, we can add:
1. A database `system_settings` table with `io_offline_mode` column
2. An admin toggle in Settings page to switch modes
3. Real-time check of IO API health to auto-detect offline status

But for now, the simple constant gives you the control you need to explicitly choose which mode to run in.
