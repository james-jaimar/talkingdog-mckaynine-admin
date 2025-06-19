
-- Update existing handler_class_status records to match lowercase class_type values
-- This ensures values like 'Puppy', 'EO', 'CGC Bronze', etc. are all stored as their proper lowercased type (e.g., 'puppy', 'eo', 'cgc bronze')

UPDATE handler_class_status
SET class_type = LOWER(class_type)
WHERE class_type IS NOT NULL;

