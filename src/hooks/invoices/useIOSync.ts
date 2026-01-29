import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

/**
 * Sync invoice to InvoicesOnline (IO)
 * This is a background operation that doesn't block the UI
 */
export async function syncInvoiceToIO(
  invoiceId: string,
  action: 'invoice' | 'payment'
): Promise<void> {
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
      return;
    }

    console.log('[IO Sync] Response:', data);

    // Handle skipped (test mode)
    if (data?.skipped) {
      console.log(`[IO Sync] Skipped: ${data.reason}`);
      // Don't show toast for skipped - it's expected in test mode
      return;
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
      return;
    }

    // Handle error in response
    if (data?.error) {
      console.error('[IO Sync] Error in response:', data.error);
      toast.error(`IO sync failed: ${data.error}`);
      return;
    }

  } catch (err) {
    console.error('[IO Sync] Unexpected error:', err);
    toast.error('IO sync failed unexpectedly');
  }
}

/**
 * Hook for IO sync operations
 */
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
