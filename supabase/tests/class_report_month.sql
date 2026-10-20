-- Integration regression: exercise real triggers; each scenario rolls back
-- in a nested subtransaction. No production invoice/class changes persist.
DO $$
DECLARE
  puppy uuid := '35f8b73a-9f40-4943-b61c-058e964965d9';
  eo2 uuid := '87126c23-3154-4d5d-805e-1f700ff08076';
  invoice uuid := '5e77ce28-2cbd-4423-94fa-f1dfaebe8933';
  before_invoice jsonb;
  after_invoice jsonb;
BEGIN
  SELECT to_jsonb(i) - ARRAY['updated_at','franchise_report_month','term_id'] INTO before_invoice
  FROM public.invoices i WHERE id = invoice;
  IF before_invoice IS NULL THEN RAISE EXCEPTION 'Missing invoice fixture'; END IF;

  BEGIN
    UPDATE public.classes SET report_month_override = '2026-12' WHERE id IN (puppy, eo2);
    IF (SELECT count(*) FROM public.invoices WHERE invoice_number IN
      ('INV-McD-2610-0053','INV-McD-2610-0054','INV-McD-2610-0055','INV-McD-2610-0056','INV-McD-2610-0057','INV-McD-2610-0058')
      AND franchise_report_month = '2026-12') <> 6 THEN
      RAISE EXCEPTION 'Single-class paid/sent invoices did not follow the override';
    END IF;
    SELECT to_jsonb(i) - ARRAY['updated_at','franchise_report_month','term_id'] INTO after_invoice FROM public.invoices i WHERE id = invoice;
    IF before_invoice IS DISTINCT FROM after_invoice THEN RAISE EXCEPTION 'Reporting edit changed financial or IO fields'; END IF;
    RAISE SQLSTATE 'ZX001' USING MESSAGE = 'rollback successful test';
  EXCEPTION WHEN SQLSTATE 'ZX001' THEN NULL;
  END;

  BEGIN
    UPDATE public.classes SET report_month_override = NULL WHERE id = puppy;
    IF (SELECT franchise_report_month FROM public.invoices WHERE id = invoice) IS DISTINCT FROM '2026-10' THEN
      RAISE EXCEPTION 'Clearing override did not restore SAST schedule month';
    END IF;
    RAISE SQLSTATE 'ZX001' USING MESSAGE = 'rollback successful test';
  EXCEPTION WHEN SQLSTATE 'ZX001' THEN NULL;
  END;

  BEGIN
    UPDATE public.invoices SET franchise_report_month = '2026-09' WHERE id = invoice;
    UPDATE public.classes SET report_month_override = '2026-12' WHERE id = puppy;
    IF (SELECT franchise_report_month FROM public.invoices WHERE id = invoice) IS DISTINCT FROM '2026-09' THEN
      RAISE EXCEPTION 'Independent invoice allocation overwritten';
    END IF;
    RAISE SQLSTATE 'ZX001' USING MESSAGE = 'rollback successful test';
  EXCEPTION WHEN SQLSTATE 'ZX001' THEN NULL;
  END;

  BEGIN
    UPDATE public.invoice_items SET booking_id = 'bcb27290-5424-4d52-8f2f-e618cd34febb'
    WHERE id = '59a91af6-6b32-45c6-a1eb-e9f1e0fe619b';
    UPDATE public.classes SET report_month_override = '2026-12' WHERE id = puppy;
    IF (SELECT franchise_report_month FROM public.invoices WHERE id = invoice) IS DISTINCT FROM '2026-11' THEN
      RAISE EXCEPTION 'Mixed-class invoice incorrectly reallocated';
    END IF;
    RAISE SQLSTATE 'ZX001' USING MESSAGE = 'rollback successful test';
  EXCEPTION WHEN SQLSTATE 'ZX001' THEN NULL;
  END;

  BEGIN
    UPDATE public.invoice_items SET booking_id = NULL WHERE id = '59a91af6-6b32-45c6-a1eb-e9f1e0fe619b';
    UPDATE public.classes SET report_month_override = '2026-12' WHERE id = puppy;
    IF (SELECT franchise_report_month FROM public.invoices WHERE id = invoice) IS DISTINCT FROM '2026-11' THEN
      RAISE EXCEPTION 'Partially unlinked invoice incorrectly reallocated';
    END IF;
    RAISE SQLSTATE 'ZX001' USING MESSAGE = 'rollback successful test';
  EXCEPTION WHEN SQLSTATE 'ZX001' THEN NULL;
  END;
  RAISE NOTICE 'All five report-month integration scenarios passed; fixture changes rolled back';
END;
$$;