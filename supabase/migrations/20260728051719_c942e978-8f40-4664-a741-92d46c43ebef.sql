CREATE OR REPLACE FUNCTION public.calculate_trainer_payment_for_schedule(p_class_schedule_id uuid, p_trainer_id uuid)
 RETURNS numeric
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_total numeric := 0;
BEGIN
  WITH schedule_bookings AS (
    SELECT b.id AS booking_id, b.client_id
    FROM public.bookings b
    WHERE b.class_schedule_id = p_class_schedule_id
  ),
  invoice_course_items AS (
    SELECT
      ii.id,
      ii.invoice_id,
      ii.booking_id,
      ii.amount::numeric AS amount,
      COALESCE(ii.item_type, '') AS item_type,
      COALESCE(ii.description, '') AS description,
      i.subtotal::numeric AS subtotal,
      COALESCE(i.monetary_discount, 0)::numeric AS monetary_discount,
      i.discount_reason,
      i.status AS invoice_status,
      sb.client_id,
      cs.trainer_id,
      COALESCE(lower(c.trainer_fee_type), 'percentage') AS trainer_fee_type,
      COALESCE(c.trainer_fee_value, 0)::numeric AS trainer_fee_value
    FROM public.invoice_items ii
    JOIN public.invoices i ON i.id = ii.invoice_id
    JOIN schedule_bookings sb ON sb.booking_id = ii.booking_id
    JOIN public.bookings b ON b.id = ii.booking_id
    JOIN public.class_schedules cs ON cs.id = b.class_schedule_id
    JOIN public.classes c ON c.id = cs.class_id
    WHERE COALESCE(i.status, '') <> 'cancelled'
      AND COALESCE(ii.item_type, '') <> 'enrollment_fee'
      AND lower(COALESCE(ii.description, '')) NOT LIKE '%enrollment fee%'
      AND lower(COALESCE(ii.description, '')) NOT LIKE '%enrolment fee%'
      AND lower(COALESCE(ii.description, '')) NOT LIKE '%starter kit%'
  ),
  invoice_item_positions AS (
    SELECT
      ici.*,
      SUM(ici.amount) OVER (PARTITION BY ici.invoice_id ORDER BY ici.id ROWS BETWEEN UNBOUNDED PRECEDING AND 1 PRECEDING) AS prior_amount,
      ROW_NUMBER() OVER (PARTITION BY ici.invoice_id ORDER BY ici.id DESC) AS reverse_row_number,
      SUM(ici.amount) OVER (PARTITION BY ici.invoice_id) AS course_item_amount_total,
      COUNT(*) OVER (PARTITION BY ici.invoice_id) AS invoice_item_count
    FROM invoice_course_items ici
  ),
  net_items AS (
    SELECT
      iip.*,
      CASE
        WHEN iip.monetary_discount <= 0 OR COALESCE(iip.subtotal, 0) <= 0 THEN round(iip.amount, 2)
        WHEN iip.reverse_row_number = 1 THEN greatest(
          0,
          round(iip.subtotal - iip.monetary_discount, 2)
            - round(COALESCE(iip.prior_amount, 0) * (1 - (iip.monetary_discount / iip.subtotal)), 2)
        )
        ELSE round(iip.amount * (1 - (iip.monetary_discount / iip.subtotal)), 2)
      END AS net_amount
    FROM invoice_item_positions iip
  ),
  invoice_flags AS (
    SELECT
      ni.invoice_id,
      COUNT(DISTINCT ni.trainer_id) AS trainer_count,
      COUNT(DISTINCT ni.client_id) AS client_count,
      COUNT(DISTINCT ni.trainer_fee_type || ':' || ni.trainer_fee_value::text) AS trainer_fee_signature_count,
      bool_or(COALESCE(ni.discount_reason, '') ~* 'multi-?dog') AS has_multi_dog_discount,
      SUM(ni.net_amount) AS invoice_net_total
    FROM net_items ni
    GROUP BY ni.invoice_id
  ),
  trainer_invoice_totals AS (
    SELECT
      ni.invoice_id,
      ni.trainer_id,
      SUM(ni.net_amount) AS trainer_net_total
    FROM net_items ni
    GROUP BY ni.invoice_id, ni.trainer_id
  ),
  canonical_items AS (
    SELECT
      ni.*,
      CASE
        WHEN flags.trainer_count > 1
          AND flags.client_count = 1
          AND flags.has_multi_dog_discount
          AND flags.trainer_fee_signature_count = 1
          AND COALESCE(totals.trainer_net_total, 0) > 0
        THEN round(ni.net_amount * ((flags.invoice_net_total / flags.trainer_count) / totals.trainer_net_total), 2)
        ELSE ni.net_amount
      END AS trainer_base_amount
    FROM net_items ni
    JOIN invoice_flags flags ON flags.invoice_id = ni.invoice_id
    JOIN trainer_invoice_totals totals ON totals.invoice_id = ni.invoice_id AND totals.trainer_id = ni.trainer_id
  )
  SELECT COALESCE(
    SUM(
      CASE
        WHEN COALESCE(canonical_items.trainer_fee_value, 0) = 0 THEN 0
        WHEN lower(COALESCE(canonical_items.trainer_fee_type, 'percentage')) IN ('fixed', 'amount')
          THEN round(canonical_items.trainer_fee_value::numeric, 2)
        ELSE round(canonical_items.trainer_base_amount * (canonical_items.trainer_fee_value::numeric / 100), 2)
      END
    ),
    0
  )
  INTO v_total
  FROM canonical_items
  WHERE canonical_items.trainer_id = p_trainer_id
    AND canonical_items.booking_id IN (SELECT booking_id FROM schedule_bookings);

  RETURN round(COALESCE(v_total, 0), 2);
END;
$function$;