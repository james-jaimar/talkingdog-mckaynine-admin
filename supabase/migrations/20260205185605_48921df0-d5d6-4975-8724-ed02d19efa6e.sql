ALTER TABLE classes 
ADD COLUMN report_month_override text;

COMMENT ON COLUMN classes.report_month_override IS 
  'Optional override for franchise report month (format: YYYY-MM). When set, invoices for this class use this month instead of auto-calculating from schedule dates.';