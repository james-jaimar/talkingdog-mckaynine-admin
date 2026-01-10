-- Add item_type column to invoice_items table to categorize line items
ALTER TABLE public.invoice_items 
ADD COLUMN item_type TEXT DEFAULT 'course_fee';

-- Update existing items: mark enrollment fee items based on description
UPDATE public.invoice_items 
SET item_type = 'enrollment_fee'
WHERE LOWER(description) LIKE '%enrollment fee%' 
   OR LOWER(description) LIKE '%enrolment fee%'
   OR LOWER(description) LIKE '%starter kit%';

-- Add a comment for documentation
COMMENT ON COLUMN public.invoice_items.item_type IS 'Type of invoice item: course_fee, enrollment_fee, or other. Enrollment fees are excluded from percentage-based fee calculations.';