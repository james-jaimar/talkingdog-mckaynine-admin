
CREATE OR REPLACE FUNCTION public.apply_fair_share_to_invoice(p_invoice_id uuid)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_discount_reason text;
  v_client_count int;
  v_item_count int;
  v_net_total numeric;
  v_share numeric;
  v_accum numeric := 0;
  v_new_amount numeric;
  r RECORD;
  v_last_id uuid;
BEGIN
  SELECT discount_reason INTO v_discount_reason FROM public.invoices WHERE id = p_invoice_id;

  WITH course_items AS (
    SELECT ii.id,
           COALESCE(ii.original_amount, ii.amount)::numeric AS gross_amount,
           b.client_id
    FROM public.invoice_items ii
    LEFT JOIN public.bookings b ON b.id = ii.booking_id
    WHERE ii.invoice_id = p_invoice_id
      AND COALESCE(ii.item_type,'') <> 'enrollment_fee'
      AND lower(COALESCE(ii.description,'')) NOT LIKE '%enrollment fee%'
      AND lower(COALESCE(ii.description,'')) NOT LIKE '%enrolment fee%'
      AND lower(COALESCE(ii.description,'')) NOT LIKE '%starter kit%'
      AND b.client_id IS NOT NULL
  )
  SELECT COUNT(*),
         COUNT(DISTINCT client_id),
         COALESCE(SUM(gross_amount), 0)
    INTO v_item_count, v_client_count, v_net_total
    FROM course_items;

  IF v_discount_reason IS NULL
     OR v_discount_reason !~* 'multi-?dog'
     OR v_client_count <> 1
     OR v_item_count < 2
     OR v_net_total <= 0
  THEN
    UPDATE public.invoice_items
       SET amount = original_amount,
           original_amount = NULL,
           adjustment_reason = NULL
     WHERE invoice_id = p_invoice_id
       AND original_amount IS NOT NULL;
    RETURN;
  END IF;

  v_share := round(v_net_total / v_item_count, 2);

  SELECT ii.id
    INTO v_last_id
    FROM public.invoice_items ii
    LEFT JOIN public.bookings b ON b.id = ii.booking_id
   WHERE ii.invoice_id = p_invoice_id
     AND COALESCE(ii.item_type,'') <> 'enrollment_fee'
     AND lower(COALESCE(ii.description,'')) NOT LIKE '%enrollment fee%'
     AND lower(COALESCE(ii.description,'')) NOT LIKE '%enrolment fee%'
     AND lower(COALESCE(ii.description,'')) NOT LIKE '%starter kit%'
     AND b.client_id IS NOT NULL
   ORDER BY ii.id DESC
   LIMIT 1;

  FOR r IN
    SELECT ii.id,
           COALESCE(ii.original_amount, ii.amount)::numeric AS gross
      FROM public.invoice_items ii
      LEFT JOIN public.bookings b ON b.id = ii.booking_id
     WHERE ii.invoice_id = p_invoice_id
       AND COALESCE(ii.item_type,'') <> 'enrollment_fee'
       AND lower(COALESCE(ii.description,'')) NOT LIKE '%enrollment fee%'
       AND lower(COALESCE(ii.description,'')) NOT LIKE '%enrolment fee%'
       AND lower(COALESCE(ii.description,'')) NOT LIKE '%starter kit%'
       AND b.client_id IS NOT NULL
     ORDER BY ii.id ASC
  LOOP
    IF r.id = v_last_id THEN
      v_new_amount := round(v_net_total - v_accum, 2);
    ELSE
      v_new_amount := v_share;
      v_accum := v_accum + v_new_amount;
    END IF;

    UPDATE public.invoice_items
       SET amount = v_new_amount,
           original_amount = COALESCE(original_amount, r.gross),
           adjustment_reason = 'multi_dog_fair_share'
     WHERE id = r.id
       AND (amount IS DISTINCT FROM v_new_amount
            OR original_amount IS NULL
            OR adjustment_reason IS DISTINCT FROM 'multi_dog_fair_share');
  END LOOP;
END;
$function$;

-- Backfill: rewrite 0004 and 0005
SELECT public.apply_fair_share_to_invoice(id)
FROM public.invoices
WHERE invoice_number IN ('INV-McD-2608-0004','INV-McD-2608-0005');
