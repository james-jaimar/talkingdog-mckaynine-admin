-- Fix Beryl Kolb's invoice: set franchise_report_month to January 2026
UPDATE invoices 
SET franchise_report_month = '2026-01'
WHERE id = '0fbe1a5b-ffbd-461d-b382-e20c50452c05';