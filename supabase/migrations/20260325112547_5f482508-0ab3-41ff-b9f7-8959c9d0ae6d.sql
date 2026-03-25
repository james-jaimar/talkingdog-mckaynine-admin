-- Trigger function: auto-sync term_id when franchise_report_month changes
CREATE OR REPLACE FUNCTION public.sync_invoice_term_from_month()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  resolved_term_id uuid;
BEGIN
  IF NEW.franchise_report_month IS NOT NULL 
     AND (TG_OP = 'INSERT' OR OLD.franchise_report_month IS DISTINCT FROM NEW.franchise_report_month) THEN
    
    resolved_term_id := public.get_term_id_for_month(NEW.franchise_report_month);
    
    IF resolved_term_id IS NOT NULL THEN
      NEW.term_id := resolved_term_id;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create the trigger
CREATE TRIGGER trg_sync_invoice_term
  BEFORE INSERT OR UPDATE ON public.invoices
  FOR EACH ROW
  EXECUTE FUNCTION public.sync_invoice_term_from_month();

-- Backfill 2026+ mismatches (setting franchise_report_month to itself triggers the new trigger)
UPDATE public.invoices
SET franchise_report_month = franchise_report_month
WHERE franchise_report_month IS NOT NULL
  AND franchise_report_month >= '2026-01'
  AND public.get_term_id_for_month(franchise_report_month) IS DISTINCT FROM term_id;