-- Fix duplicate invoice number: Update Duncan Miller's invoice from 0016 to 0019
UPDATE public.invoices 
SET invoice_number = 'INV-McD-2602-0019'
WHERE id = '04dddf41-5661-4cd4-991d-ced7224d60ad'
AND invoice_number = 'INV-McD-2602-0016';