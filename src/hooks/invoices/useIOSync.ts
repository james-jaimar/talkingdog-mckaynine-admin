import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

/**
 * IO Mode Configuration
 * When IO_OFFLINE_MODE is true, the system uses local PDF generation
 * When false (default), the system REQUIRES IO PDF - no silent fallback
 * 
 * To switch modes, change this constant. Future enhancement: move to database setting.
 */
export const IO_OFFLINE_MODE = false;

/**
 * Sync invoice to InvoicesOnline (IO)
 * This is a background operation that doesn't block the UI
 * Returns result object for callers that need to check success
 */
export async function syncInvoiceToIO(
  invoiceId: string,
  action: 'invoice' | 'payment'
): Promise<{ success: boolean; error?: string; skipped?: boolean; io_invoice_url?: string }> {
  console.log(`[IO Sync] Starting ${action} sync for invoice ${invoiceId}`);
  
  try {
    const { data, error } = await supabase.functions.invoke('sync-invoice-to-io', {
      body: {
        invoice_id: invoiceId,
        action: action,
      },
    });

    if (error) {
      console.error('[IO Sync] Edge function error:', error);
      toast.error(`IO sync failed: ${error.message}`);
      return { success: false, error: error.message };
    }

    console.log('[IO Sync] Response:', data);

    // Handle skipped (test mode)
    if (data?.skipped) {
      console.log(`[IO Sync] Skipped: ${data.reason}`);
      // Don't show toast for skipped - it's expected in test mode
      return { success: true, skipped: true };
    }

    // Handle success
    if (data?.success) {
      if (action === 'invoice') {
        toast.success('Invoice synced to InvoicesOnline', {
          description: `IO Invoice #${data.io_invoice_number || 'Created'}`,
        });
      } else {
        toast.success('Payment synced to InvoicesOnline');
      }
      return { 
        success: true, 
        io_invoice_url: data.io_invoice_url 
      };
    }

    // Handle error in response
    if (data?.error) {
      console.error('[IO Sync] Error in response:', data.error);
      toast.error(`IO sync failed: ${data.error}`);
      return { success: false, error: data.error };
    }

    return { success: false, error: 'Unknown error' };

  } catch (err) {
    console.error('[IO Sync] Unexpected error:', err);
    toast.error('IO sync failed unexpectedly');
    return { success: false, error: String(err) };
  }
}

/**
 * Issue a credit note in InvoicesOnline for an invoice being deleted
 * Returns success/error result without throwing
 */
export async function issueCreditNote(invoiceId: string): Promise<{
  success: boolean;
  error?: string;
}> {
  console.log(`[IO Sync] Issuing credit note for invoice ${invoiceId}`);
  
  try {
    const { data, error } = await supabase.functions.invoke('sync-invoice-to-io', {
      body: {
        invoice_id: invoiceId,
        action: 'credit_note',
      },
    });

    if (error) {
      console.error('[IO Sync] Credit note edge function error:', error);
      return { success: false, error: error.message };
    }

    console.log('[IO Sync] Credit note response:', data);

    // Handle skipped (test mode or not synced to IO)
    if (data?.skipped) {
      console.log(`[IO Sync] Credit note skipped: ${data.reason}`);
      return { success: true }; // Not synced to IO, nothing to credit
    }

    // Handle success
    if (data?.success) {
      return { success: true };
    }

    // Handle error in response
    if (data?.error) {
      console.error('[IO Sync] Credit note error in response:', data.error);
      return { success: false, error: data.error };
    }

    return { success: false, error: 'Unknown error' };
  } catch (err) {
    console.error('[IO Sync] Credit note unexpected error:', err);
    return { success: false, error: String(err) };
  }
}

/**
 * Fetch PDF from IO for an invoice
 * Returns base64-encoded PDF or error
 */
export async function fetchIOPDF(invoiceId: string): Promise<{
  success: boolean;
  pdfBase64?: string;
  error?: string;
}> {
  console.log(`[IO Sync] Fetching PDF for invoice ${invoiceId}`);
  
  try {
    const { data, error } = await supabase.functions.invoke('sync-invoice-to-io', {
      body: {
        invoice_id: invoiceId,
        action: 'get_pdf',
      },
    });

    if (error) {
      console.error('[IO Sync] PDF fetch edge function error:', error);
      return { success: false, error: error.message };
    }

    console.log('[IO Sync] PDF fetch response:', data?.success ? 'Success' : data);

    if (data?.success && data?.pdf_base64) {
      return { success: true, pdfBase64: data.pdf_base64 };
    }

    if (data?.error) {
      return { success: false, error: data.error };
    }

    return { success: false, error: 'No PDF data returned' };
  } catch (err) {
    console.error('[IO Sync] PDF fetch unexpected error:', err);
    return { success: false, error: String(err) };
  }
}

/**
 * Sync invoice to IO and fetch the PDF in one workflow
 * Shows progress to the user via callback
 * 
 * When IO_OFFLINE_MODE is true: skips IO entirely, returns useLocalPdf flag
 * When IO_OFFLINE_MODE is false: REQUIRES IO PDF, returns error on failure (no silent fallback)
 */
export async function syncAndGetPDF(
  invoiceId: string,
  onProgress: (step: number, message: string) => void
): Promise<{ success: boolean; pdfBase64?: string; error?: string; useLocalPdf?: boolean }> {
  
  // If IO is explicitly offline, signal to use local PDF immediately
  if (IO_OFFLINE_MODE) {
    onProgress(1, "IO offline mode - using local PDF generation...");
    return { success: true, useLocalPdf: true };
  }
  
  onProgress(1, "Checking InvoicesOnline sync status...");
  
  // Step 1: Check if already synced to IO
  const { data: invoice, error: fetchError } = await supabase
    .from('invoices')
    .select('io_document_id, io_invoice_url')
    .eq('id', invoiceId)
    .single();
  
  if (fetchError) {
    return { success: false, error: `Failed to fetch invoice: ${fetchError.message}` };
  }
  
  // Step 2: Sync to IO if not already synced
  if (!invoice?.io_document_id) {
    onProgress(1, "Syncing invoice to InvoicesOnline...");
    
    const syncResult = await syncInvoiceToIO(invoiceId, 'invoice');
    
    if (!syncResult.success && !syncResult.skipped) {
      return { success: false, error: syncResult.error || 'Failed to sync to IO' };
    }
    
    // If skipped (test mode), use local PDF
    if (syncResult.skipped) {
      onProgress(2, "Test mode - using local PDF generation...");
      return { success: true, useLocalPdf: true };
    }
  }
  
  onProgress(2, "Fetching PDF from InvoicesOnline...");
  
  // Step 3: Get PDF from IO - NO SILENT FALLBACK
  const pdfResult = await fetchIOPDF(invoiceId);
  
  if (!pdfResult.success || !pdfResult.pdfBase64) {
    // IO is online but PDF fetch failed - return error, don't silently fallback
    return { 
      success: false, 
      error: pdfResult.error || 'Failed to fetch PDF from InvoicesOnline. Please retry or contact support.' 
    };
  }
  
  onProgress(4, "Ready!");
  return { success: true, pdfBase64: pdfResult.pdfBase64 };
}

/**
 * Hook for IO sync operations
 */
export function useIOSync() {
  const syncInvoice = async (invoiceId: string) => {
    await syncInvoiceToIO(invoiceId, 'invoice');
  };

  const syncPayment = async (invoiceId: string) => {
    await syncInvoiceToIO(invoiceId, 'payment');
  };

  return {
    syncInvoice,
    syncPayment,
  };
}
