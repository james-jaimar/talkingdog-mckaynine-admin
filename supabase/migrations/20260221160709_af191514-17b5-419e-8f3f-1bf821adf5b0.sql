
-- Add io_inventory_code to classes table
ALTER TABLE public.classes ADD COLUMN io_inventory_code text NULL;

-- Add io_inventory_code to invoice_items table
ALTER TABLE public.invoice_items ADD COLUMN io_inventory_code text NULL;
