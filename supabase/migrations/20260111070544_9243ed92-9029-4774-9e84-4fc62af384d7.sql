-- Add franchise_report_month column to invoices
-- This allows manual allocation of invoices to a specific month for franchise reporting
-- Format: 'YYYY-MM' (e.g., '2026-04' for April 2026)
ALTER TABLE public.invoices 
ADD COLUMN franchise_report_month TEXT;

-- Add an index for efficient querying by franchise report month
CREATE INDEX idx_invoices_franchise_report_month ON public.invoices(franchise_report_month);

-- Add a comment explaining the column purpose
COMMENT ON COLUMN public.invoices.franchise_report_month IS 'Override month for franchise reporting. Format: YYYY-MM. If NULL, uses issued_date for reporting.';