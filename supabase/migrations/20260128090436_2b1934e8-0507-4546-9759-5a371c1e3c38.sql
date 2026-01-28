-- Add IO tracking columns to invoices table
ALTER TABLE public.invoices
ADD COLUMN IF NOT EXISTS io_sync_status text DEFAULT NULL,
ADD COLUMN IF NOT EXISTS io_sync_error text DEFAULT NULL,
ADD COLUMN IF NOT EXISTS io_synced_at timestamp with time zone DEFAULT NULL,
ADD COLUMN IF NOT EXISTS io_document_id text DEFAULT NULL,
ADD COLUMN IF NOT EXISTS io_invoice_number text DEFAULT NULL,
ADD COLUMN IF NOT EXISTS io_invoice_url text DEFAULT NULL,
ADD COLUMN IF NOT EXISTS io_payment_url text DEFAULT NULL,
ADD COLUMN IF NOT EXISTS io_client_id integer DEFAULT NULL;

-- Add IO client ID columns to clients table (per branch)
ALTER TABLE public.clients
ADD COLUMN IF NOT EXISTS io_client_id_delta integer DEFAULT NULL,
ADD COLUMN IF NOT EXISTS io_client_id_randburg integer DEFAULT NULL;

-- Add comment for documentation
COMMENT ON COLUMN public.invoices.io_sync_status IS 'IO sync status: pending, synced, failed, payment_synced';
COMMENT ON COLUMN public.invoices.io_sync_error IS 'Error message if IO sync failed';
COMMENT ON COLUMN public.invoices.io_synced_at IS 'Timestamp when invoice was synced to IO';
COMMENT ON COLUMN public.invoices.io_document_id IS 'Document ID from InvoicesOnline';
COMMENT ON COLUMN public.invoices.io_invoice_number IS 'Invoice number from InvoicesOnline';
COMMENT ON COLUMN public.invoices.io_invoice_url IS 'URL to download IO invoice PDF';
COMMENT ON COLUMN public.invoices.io_payment_url IS 'URL to download IO payment receipt PDF';
COMMENT ON COLUMN public.invoices.io_client_id IS 'IO client ID used for this invoice';
COMMENT ON COLUMN public.clients.io_client_id_delta IS 'IO client ID for Delta branch account';
COMMENT ON COLUMN public.clients.io_client_id_randburg IS 'IO client ID for Randburg branch account';