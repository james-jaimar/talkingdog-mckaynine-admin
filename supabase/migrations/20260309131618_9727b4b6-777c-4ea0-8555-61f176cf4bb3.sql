
-- Add term_id column to invoices table
ALTER TABLE public.invoices ADD COLUMN term_id uuid REFERENCES public.terms(id) ON DELETE SET NULL;

-- Backfill existing invoices with term_id from their linked class schedules
UPDATE invoices i
SET term_id = cs.term_id
FROM invoice_items ii
JOIN bookings b ON b.id = ii.booking_id
JOIN class_schedules cs ON cs.id = b.class_schedule_id
WHERE ii.invoice_id = i.id
  AND i.term_id IS NULL
  AND cs.term_id IS NOT NULL;
