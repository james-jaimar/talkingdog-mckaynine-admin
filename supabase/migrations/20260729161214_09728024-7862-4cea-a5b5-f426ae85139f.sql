CREATE OR REPLACE FUNCTION public.calculate_trainer_payment_for_schedule(p_class_schedule_id uuid, p_trainer_id uuid)
 RETURNS numeric
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_total numeric := 0;
BEGIN
  WITH target_schedule_bookings AS (
    SELECT b.id AS booking_id
    FROM public.bookings b
    WHERE b.class_schedule_id = p_class_schedule_id
  ),
  target_invoices AS (
    SELECT DISTINCT ii.invoice_id
    FROM public.invoice_items ii
    JOIN target_schedule_bookings tsb ON tsb.booking_id = ii.booking_id
    JOIN public.invoices i ON i.id = ii.invoice_id
    WHERE COALESCE(i.status, '') <> 'cancelled'
  ),
  invoice_items_with_net_input AS (
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
      i.status AS invoice_status
    FROM public.invoice_items ii
    JOIN target_invoices ti ON ti.invoice_id = ii.invoice_id
    JOIN public.invoices i ON i.id = ii.invoice_id
    WHERE COALESCE(i.status, '') <> 'cancelled'
  ),
  invoice_item_positions AS (
    SELECT
      iini.*,
      SUM(iini.amount) OVER (PARTITION BY iini.invoice_id ORDER BY iini.id ROWS BETWEEN UNBOUNDED PRECEDING AND 1 PRECEDING) AS prior_amount,
      ROW_NUMBER() OVER (PARTITION BY iini.invoice_id ORDER BY iini.id DESC) AS reverse_row_number
    FROM invoice_items_with_net_input iini
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
  course_items AS (
    SELECT
      ni.*,
      b.client_id,
      cs.trainer_id,
      COALESCE(lower(c.trainer_fee_type), 'percentage') AS trainer_fee_type,
      COALESCE(c.trainer_fee_value, 0)::numeric AS trainer_fee_value
    FROM net_items ni
    JOIN public.bookings b ON b.id = ni.booking_id
    JOIN public.class_schedules cs ON cs.id = b.class_schedule_id
    JOIN public.classes c ON c.id = cs.class_id
    WHERE COALESCE(ni.item_type, '') <> 'enrollment_fee'
      AND lower(COALESCE(ni.description, '')) NOT LIKE '%enrollment fee%'
      AND lower(COALESCE(ni.description, '')) NOT LIKE '%enrolment fee%'
      AND lower(COALESCE(ni.description, '')) NOT LIKE '%starter kit%'
  ),
  invoice_flags AS (
    SELECT
      ci.invoice_id,
      COUNT(DISTINCT ci.trainer_id) AS trainer_count,
      COUNT(DISTINCT ci.client_id) AS client_count,
      bool_or(COALESCE(ci.discount_reason, '') ~* 'multi-?dog') AS has_multi_dog_discount,
      SUM(ci.net_amount) AS invoice_net_total
    FROM course_items ci
    GROUP BY ci.invoice_id
  ),
  trainer_invoice_totals AS (
    SELECT
      ci.invoice_id,
      ci.trainer_id,
      SUM(ci.net_amount) AS trainer_net_total
    FROM course_items ci
    GROUP BY ci.invoice_id, ci.trainer_id
  ),
  canonical_items AS (
    SELECT
      ci.*,
      CASE
        WHEN flags.trainer_count > 1
          AND flags.client_count = 1
          AND flags.has_multi_dog_discount
          AND COALESCE(totals.trainer_net_total, 0) > 0
        THEN round(ci.net_amount * ((flags.invoice_net_total / flags.trainer_count) / totals.trainer_net_total), 2)
        ELSE ci.net_amount
      END AS trainer_base_amount
    FROM course_items ci
    JOIN invoice_flags flags ON flags.invoice_id = ci.invoice_id
    JOIN trainer_invoice_totals totals ON totals.invoice_id = ci.invoice_id AND totals.trainer_id = ci.trainer_id
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
    AND canonical_items.booking_id IN (SELECT booking_id FROM target_schedule_bookings);

  RETURN round(COALESCE(v_total, 0), 2);
END;
$function$;