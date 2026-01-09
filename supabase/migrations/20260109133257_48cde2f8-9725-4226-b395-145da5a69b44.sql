-- Drop the existing unique constraint
ALTER TABLE public.handler_class_status 
DROP CONSTRAINT IF EXISTS handler_class_status_handler_id_class_type_dog_id_key;

-- Create a new unique constraint that includes period
-- This allows multiple entries for the same dog/class type when they have different periods
ALTER TABLE public.handler_class_status 
ADD CONSTRAINT handler_class_status_handler_dog_class_period_key 
UNIQUE (handler_id, class_type, dog_id, period);