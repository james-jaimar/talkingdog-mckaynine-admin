UPDATE public.invoice_items
SET booking_id = '435231ba-709d-4629-aa32-007834dfedbd',
    updated_at = now()
WHERE id = 'aacef2f1-887f-48c5-9825-f27b8c932f2f'
  AND booking_id IS NULL;