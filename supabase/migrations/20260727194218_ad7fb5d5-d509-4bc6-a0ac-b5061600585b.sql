CREATE OR REPLACE FUNCTION public.calculate_trainer_payment(p_booking_id uuid)
RETURNS numeric
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_class_schedule_id uuid;
  v_trainer_id uuid;
BEGIN
  SELECT b.class_schedule_id, cs.trainer_id
  INTO v_class_schedule_id, v_trainer_id
  FROM public.bookings b
  JOIN public.class_schedules cs ON cs.id = b.class_schedule_id
  WHERE b.id = p_booking_id;

  IF v_class_schedule_id IS NULL OR v_trainer_id IS NULL THEN
    RETURN 0;
  END IF;

  RETURN public.calculate_trainer_payment_for_schedule(v_class_schedule_id, v_trainer_id);
END;
$function$;

CREATE OR REPLACE FUNCTION public.calculate_trainer_payment_for_schedule(
  p_class_schedule_id uuid,
  p_trainer_id uuid
)
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
      c.trainer_fee_type,
      c.trainer_fee_value
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

CREATE OR REPLACE FUNCTION public.create_trainer_payment_for_booking()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_trainer_id uuid;
  v_class_schedule_id uuid;
  v_amount numeric;
BEGIN
  IF NEW.booking_id IS NULL THEN
    RETURN NEW;
  END IF;

  SELECT cs.id, cs.trainer_id
  INTO v_class_schedule_id, v_trainer_id
  FROM public.bookings b
  JOIN public.class_schedules cs ON b.class_schedule_id = cs.id
  WHERE b.id = NEW.booking_id;

  IF v_trainer_id IS NULL OR v_class_schedule_id IS NULL THEN
    RETURN NEW;
  END IF;

  v_amount := public.calculate_trainer_payment_for_schedule(v_class_schedule_id, v_trainer_id);

  INSERT INTO public.trainer_payments (
    trainer_id,
    class_schedule_id,
    booking_id,
    invoice_item_id,
    amount,
    status
  ) VALUES (
    v_trainer_id,
    v_class_schedule_id,
    NEW.booking_id,
    NEW.id,
    v_amount,
    'pending'
  )
  ON CONFLICT (trainer_id, class_schedule_id)
  DO UPDATE SET
    invoice_item_id = NEW.id,
    booking_id = NEW.booking_id,
    amount = EXCLUDED.amount,
    updated_at = now();

  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    RAISE WARNING 'Error creating trainer payment: %', SQLERRM;
    RETURN NEW;
END;
$function$;