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
