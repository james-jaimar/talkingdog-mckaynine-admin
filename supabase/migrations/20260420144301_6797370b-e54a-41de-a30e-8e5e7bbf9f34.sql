UPDATE public.invoice_items
SET booking_id = '94c1d769-f824-49c5-8dbb-ce6975f4548e',
    io_inventory_code = COALESCE(io_inventory_code, 'PU'),
    updated_at = now()
WHERE id = '2c333bf9-d33d-4575-bcf3-094c57abd10c'
  AND booking_id IS NULL;