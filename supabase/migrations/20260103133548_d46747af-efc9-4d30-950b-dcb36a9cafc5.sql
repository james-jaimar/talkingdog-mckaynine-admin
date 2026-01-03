-- Fix the PUPPY CLASS schedule that was incorrectly assigned to Term 1
-- The dates are in July/Aug/Sept 2025 which is Term 3
UPDATE class_schedules 
SET term_id = '295f3c9c-7de6-420b-9cca-aee06b888329'
WHERE id = '56b48c29-d02c-4a67-a10b-d57c685e8aad';