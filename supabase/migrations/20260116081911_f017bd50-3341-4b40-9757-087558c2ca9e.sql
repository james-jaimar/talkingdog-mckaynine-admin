-- Fix orphaned invoice item for Fagin (Allison Gilbert's invoice INV-McD-2601-0022)
-- This item was missing a booking_id and had an incorrect class description
UPDATE invoice_items
SET 
  booking_id = 'e79be8f9-cac4-4610-a1c6-6621a4ab3233',
  description = '16h15 Yoga January training class for Fagin (25% multi-dog discount applied)',
  updated_at = now()
WHERE id = '71c5a55d-d0ac-4eda-a805-3340830d028b';