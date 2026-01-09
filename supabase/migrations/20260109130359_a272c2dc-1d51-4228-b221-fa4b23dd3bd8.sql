
-- Drop the existing unique constraint that only allows one record per handler per class type
ALTER TABLE public.handler_class_status 
DROP CONSTRAINT IF EXISTS handler_class_status_handler_id_class_type_key;

-- Add a new unique constraint that allows multiple dogs per class type per handler
-- The constraint now includes booking_id to differentiate between dogs
ALTER TABLE public.handler_class_status 
ADD CONSTRAINT handler_class_status_handler_booking_class_key 
UNIQUE (handler_id, class_type, booking_id);

-- Also add an index for efficient lookups by handler
CREATE INDEX IF NOT EXISTS idx_handler_class_status_handler_id 
ON public.handler_class_status(handler_id);

-- Add index for class_type lookups
CREATE INDEX IF NOT EXISTS idx_handler_class_status_class_type 
ON public.handler_class_status(class_type);
