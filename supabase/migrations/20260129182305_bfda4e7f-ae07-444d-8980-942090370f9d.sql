-- Add columns for tracking IO credit notes
ALTER TABLE public.invoices 
ADD COLUMN IF NOT EXISTS io_credit_note_id text,
ADD COLUMN IF NOT EXISTS io_credit_note_number text,
ADD COLUMN IF NOT EXISTS io_credit_note_url text;