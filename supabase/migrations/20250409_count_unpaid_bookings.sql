
-- This migration adds a function to count bookings that don't have proof of payment
-- and don't have a paid invoice associated with them
CREATE OR REPLACE FUNCTION public.count_unpaid_bookings()
 RETURNS integer
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
  unpaid_count INTEGER;
BEGIN
  -- Count bookings that don't have proof of payment and don't have a paid invoice
  SELECT COUNT(DISTINCT b.id)
  INTO unpaid_count
  FROM bookings b
  LEFT JOIN invoice_items ii ON b.id = ii.booking_id
  LEFT JOIN invoices i ON ii.invoice_id = i.id
  WHERE (b.proof_of_payment IS NULL OR b.proof_of_payment = '')
  AND (i.id IS NULL OR i.payment_received = false);
  
  RETURN unpaid_count;
END;
$function$;
