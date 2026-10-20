-- Financial triggers must not recalculate money for reporting-only edits.
DROP TRIGGER calculate_discounts_trigger ON public.invoices;
CREATE TRIGGER calculate_discounts_trigger BEFORE INSERT OR UPDATE OF subtotal, discount_type, discount_amount, tax_rate ON public.invoices FOR EACH ROW EXECUTE FUNCTION public.calculate_invoice_discounts();
DROP TRIGGER calculate_invoice_total ON public.invoices;
CREATE TRIGGER calculate_invoice_total BEFORE INSERT OR UPDATE OF subtotal, discount_type, discount_amount, tax_rate ON public.invoices FOR EACH ROW EXECUTE FUNCTION public.calculate_invoice_total();

CREATE OR REPLACE FUNCTION public.sync_class_invoice_report_month()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  IF NEW.report_month_override IS NOT NULL AND NEW.report_month_override !~ '^[0-9]{4}-(0[1-9]|1[0-2])$' THEN
    RAISE EXCEPTION 'Report month must use YYYY-MM format';
  END IF;
  WITH linked AS (
    SELECT i.id, min(to_char(cs.start_time AT TIME ZONE 'Africa/Johannesburg', 'YYYY-MM')) AS schedule_month
    FROM public.invoices i
    JOIN public.invoice_items ii ON ii.invoice_id = i.id
    LEFT JOIN public.bookings b ON b.id = ii.booking_id
    LEFT JOIN public.class_schedules cs ON cs.id = b.class_schedule_id
    WHERE i.branch_id = NEW.branch_id
    GROUP BY i.id
    HAVING bool_and(cs.class_id IS NOT NULL AND cs.class_id = NEW.id)
       AND count(DISTINCT to_char(cs.start_time AT TIME ZONE 'Africa/Johannesburg', 'YYYY-MM')) = 1
  )
  UPDATE public.invoices i
  SET franchise_report_month = COALESCE(NEW.report_month_override, linked.schedule_month)
  FROM linked
  WHERE i.id = linked.id
    AND (i.franchise_report_month IS NULL
         OR i.franchise_report_month = COALESCE(OLD.report_month_override, linked.schedule_month))
    AND i.franchise_report_month IS DISTINCT FROM COALESCE(NEW.report_month_override, linked.schedule_month);
  RETURN NEW;
END;
$$;
REVOKE ALL ON FUNCTION public.sync_class_invoice_report_month() FROM PUBLIC, anon, authenticated;
CREATE TRIGGER trg_sync_class_invoice_report_month AFTER UPDATE OF report_month_override ON public.classes
FOR EACH ROW WHEN (OLD.report_month_override IS DISTINCT FROM NEW.report_month_override)
EXECUTE FUNCTION public.sync_class_invoice_report_month();

UPDATE public.invoices SET franchise_report_month = '2026-11'
WHERE branch_id = '6351a9e8-77db-403b-ab1f-cd47e393a006'
AND invoice_number IN ('INV-McD-2610-0053','INV-McD-2610-0054','INV-McD-2610-0055','INV-McD-2610-0056','INV-McD-2610-0057','INV-McD-2610-0058')
AND franchise_report_month = '2026-10';