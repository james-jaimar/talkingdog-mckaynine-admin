-- Drop ALL existing unique constraints on handler_class_status
ALTER TABLE public.handler_class_status 
DROP CONSTRAINT IF EXISTS handler_class_status_handler_id_class_type_key;

ALTER TABLE public.handler_class_status 
DROP CONSTRAINT IF EXISTS handler_class_status_handler_id_class_type_dog_id_key;

ALTER TABLE public.handler_class_status 
DROP CONSTRAINT IF EXISTS handler_class_status_handler_dog_class_key;

ALTER TABLE public.handler_class_status 
DROP CONSTRAINT IF EXISTS handler_class_status_handler_dog_class_period_key;

-- Create the new constraint that includes period (allowing retakes)
ALTER TABLE public.handler_class_status 
ADD CONSTRAINT handler_class_status_unique_entry 
UNIQUE (handler_id, class_type, dog_id, period);