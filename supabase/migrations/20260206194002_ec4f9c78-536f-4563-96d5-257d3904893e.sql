-- Backfill ALL invoices with NULL franchise_report_month
-- This includes the 18 Delta invoices and any others that may exist
-- Sets franchise_report_month based on issued_date (YYYY-MM format)

UPDATE invoices 
SET franchise_report_month = 
  TO_CHAR(issued_date, 'YYYY-MM')
WHERE franchise_report_month IS NULL;