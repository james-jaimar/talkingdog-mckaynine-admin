
-- 1. Add columns
ALTER TABLE public.invoice_items
  ADD COLUMN IF NOT EXISTS original_amount NUMERIC,
  ADD COLUMN IF NOT EXISTS adjustment_reason TEXT;

-- 2. Fair-share recalculator
CREATE OR REPLACE FUNCTION public.apply_fair_share_to_invoice(p_invoice_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_discount_reason text;
  v_trainer_count int;
  v_client_count int;
  v_net_total numeric;
  v_share numeric;
  r RECORD;
  v_trainer_original_total numeric;
  v_new_amount numeric;
BEGIN
  SELECT discount_reason INTO v_discount_reason FROM public.invoices WHERE id = p_invoice_id;

  -- Compute across allocated course items only
  WITH course_items AS (
    SELECT ii.id,
           COALESCE(ii.original_amount, ii.amount)::numeric AS gross_amount,
           b.client_id,
           cs.trainer_id
    FROM public.invoice_items ii
    LEFT JOIN public.bookings b ON b.id = ii.booking_id
    LEFT JOIN public.class_schedules cs ON cs.id = b.class_schedule_id
    WHERE ii.invoice_id = p_invoice_id
      AND COALESCE(ii.item_type,'') <> 'enrollment_fee'
      AND lower(COALESCE(ii.description,'')) NOT LIKE '%enrollment fee%'
      AND lower(COALESCE(ii.description,'')) NOT LIKE '%enrolment fee%'
      AND lower(COALESCE(ii.description,'')) NOT LIKE '%starter kit%'
      AND cs.trainer_id IS NOT NULL
      AND b.client_id IS NOT NULL
  )
  SELECT COUNT(DISTINCT trainer_id),
         COUNT(DISTINCT client_id),
         COALESCE(SUM(gross_amount), 0)
    INTO v_trainer_count, v_client_count, v_net_total
    FROM course_items;

  -- Conditions to keep the rewrite active
  IF v_discount_reason IS NULL
     OR v_discount_reason !~* 'multi-?dog'
     OR v_trainer_count IS NULL
     OR v_trainer_count <= 1
     OR v_client_count <> 1
     OR v_net_total <= 0
  THEN
    -- Revert any prior adjustment
    UPDATE public.invoice_items
       SET amount = original_amount,
           original_amount = NULL,
           adjustment_reason = NULL
     WHERE invoice_id = p_invoice_id
       AND original_amount IS NOT NULL;
    RETURN;
  END IF;

  v_share := round(v_net_total / v_trainer_count, 2);

  FOR r IN
    SELECT ii.id,
           COALESCE(ii.original_amount, ii.amount)::numeric AS gross,
           cs.trainer_id
      FROM public.invoice_items ii
      JOIN public.bookings b ON b.id = ii.booking_id
      JOIN public.class_schedules cs ON cs.id = b.class_schedule_id
     WHERE ii.invoice_id = p_invoice_id
       AND COALESCE(ii.item_type,'') <> 'enrollment_fee'
       AND lower(COALESCE(ii.description,'')) NOT LIKE '%enrollment fee%'
       AND lower(COALESCE(ii.description,'')) NOT LIKE '%enrolment fee%'
       AND lower(COALESCE(ii.description,'')) NOT LIKE '%starter kit%'
       AND cs.trainer_id IS NOT NULL
  LOOP
    SELECT COALESCE(SUM(COALESCE(ii2.original_amount, ii2.amount)), 0)
      INTO v_trainer_original_total
      FROM public.invoice_items ii2
      JOIN public.bookings b2 ON b2.id = ii2.booking_id
      JOIN public.class_schedules cs2 ON cs2.id = b2.class_schedule_id
     WHERE ii2.invoice_id = p_invoice_id
       AND cs2.trainer_id = r.trainer_id
       AND COALESCE(ii2.item_type,'') <> 'enrollment_fee'
       AND lower(COALESCE(ii2.description,'')) NOT LIKE '%enrollment fee%'
       AND lower(COALESCE(ii2.description,'')) NOT LIKE '%enrolment fee%'
       AND lower(COALESCE(ii2.description,'')) NOT LIKE '%starter kit%';

    IF v_trainer_original_total > 0 THEN
      v_new_amount := round(r.gross * (v_share / v_trainer_original_total), 2);
      UPDATE public.invoice_items
         SET amount = v_new_amount,
             original_amount = COALESCE(original_amount, r.gross),
             adjustment_reason = 'multi_dog_fair_share'
       WHERE id = r.id
         AND (amount IS DISTINCT FROM v_new_amount
              OR original_amount IS NULL
              OR adjustment_reason IS DISTINCT FROM 'multi_dog_fair_share');
    END IF;
  END LOOP;
END;
$$;

-- 3. Trigger functions (guarded against recursion)
CREATE OR REPLACE FUNCTION public.trg_fair_share_from_items()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF pg_trigger_depth() > 1 THEN
    RETURN NULL;
  END IF;
  IF TG_OP = 'DELETE' THEN
    PERFORM public.apply_fair_share_to_invoice(OLD.invoice_id);
  ELSE
    PERFORM public.apply_fair_share_to_invoice(NEW.invoice_id);
  END IF;
  RETURN NULL;
END;
$$;

CREATE OR REPLACE FUNCTION public.trg_fair_share_from_invoice()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF pg_trigger_depth() > 1 THEN
    RETURN NULL;
  END IF;
  PERFORM public.apply_fair_share_to_invoice(NEW.id);
  RETURN NULL;
END;
$$;

DROP TRIGGER IF EXISTS trg_apply_fair_share_after_items ON public.invoice_items;
CREATE TRIGGER trg_apply_fair_share_after_items
AFTER INSERT OR UPDATE OR DELETE ON public.invoice_items
FOR EACH ROW EXECUTE FUNCTION public.trg_fair_share_from_items();

DROP TRIGGER IF EXISTS trg_apply_fair_share_after_invoice_update ON public.invoices;
CREATE TRIGGER trg_apply_fair_share_after_invoice_update
AFTER UPDATE OF discount_reason, monetary_discount, subtotal ON public.invoices
FOR EACH ROW
WHEN (OLD.discount_reason IS DISTINCT FROM NEW.discount_reason
   OR OLD.monetary_discount IS DISTINCT FROM NEW.monetary_discount
   OR OLD.subtotal IS DISTINCT FROM NEW.subtotal)
EXECUTE FUNCTION public.trg_fair_share_from_invoice();

-- 4. Simplify trainer payment function - fairness is now baked into invoice_items.amount
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
  )
  SELECT COALESCE(
    SUM(
      CASE
        WHEN COALESCE(course_items.trainer_fee_value, 0) = 0 THEN 0
        WHEN course_items.trainer_fee_type IN ('fixed', 'amount')
          THEN round(course_items.trainer_fee_value::numeric, 2)
        ELSE round(course_items.net_amount * (course_items.trainer_fee_value::numeric / 100), 2)
      END
    ),
    0
  )
  INTO v_total
  FROM course_items
  WHERE course_items.trainer_id = p_trainer_id
    AND course_items.booking_id IN (SELECT booking_id FROM target_schedule_bookings);

  RETURN round(COALESCE(v_total, 0), 2);
END;
$function$;
