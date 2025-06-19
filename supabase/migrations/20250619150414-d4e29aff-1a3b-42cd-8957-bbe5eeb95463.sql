
-- Fix handler_class_status to use exact CLASS_TYPES casing instead of lowercase
-- This ensures 'puppy' becomes 'Puppy', 'eo' becomes 'EO', 'cgc bronze' becomes 'CGC Bronze', etc.

UPDATE handler_class_status 
SET class_type = CASE 
  WHEN LOWER(class_type) = 'puppy' THEN 'Puppy'
  WHEN LOWER(class_type) = 'eo' THEN 'EO'
  WHEN LOWER(class_type) = 'cgc bronze' THEN 'CGC Bronze'
  WHEN LOWER(class_type) = 'cgc silver' THEN 'CGC Silver'
  WHEN LOWER(class_type) = 'beginner' THEN 'Beginner'
  WHEN LOWER(class_type) = 'novice' THEN 'Novice'
  WHEN LOWER(class_type) = 'wt' THEN 'WT'
  WHEN LOWER(class_type) = 'a-test' THEN 'A-Test'
  WHEN LOWER(class_type) = 'yoga' THEN 'Yoga'
  ELSE class_type
END
WHERE class_type IS NOT NULL;
