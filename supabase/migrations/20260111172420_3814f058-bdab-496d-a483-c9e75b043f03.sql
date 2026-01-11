-- Fix invoice items with incorrect item_type for enrollment fees
UPDATE invoice_items 
SET item_type = 'enrollment_fee' 
WHERE (LOWER(description) LIKE '%enrollment fee%' 
    OR LOWER(description) LIKE '%enrolment fee%'
    OR LOWER(description) LIKE '%starter kit%')
  AND (item_type IS NULL OR item_type != 'enrollment_fee');