
-- Add direct dog_id column to handler_class_status for manual entries without bookings
ALTER TABLE public.handler_class_status 
ADD COLUMN IF NOT EXISTS dog_id uuid REFERENCES public.dogs(id);

-- Update the unique constraint to use dog_id instead of booking_id for better flexibility
-- First drop the existing constraint
ALTER TABLE public.handler_class_status 
DROP CONSTRAINT IF EXISTS handler_class_status_handler_booking_class_key;

-- Add new unique constraint that allows one entry per handler + class_type + dog
-- This allows multiple dogs per handler per class type
ALTER TABLE public.handler_class_status 
ADD CONSTRAINT handler_class_status_handler_dog_class_key 
UNIQUE (handler_id, class_type, dog_id);

-- Backfill dog_id from existing bookings
UPDATE public.handler_class_status hcs
SET dog_id = b.dog_id
FROM public.bookings b
WHERE hcs.booking_id = b.id
  AND hcs.dog_id IS NULL;

-- Add index for dog_id lookups
CREATE INDEX IF NOT EXISTS idx_handler_class_status_dog_id 
ON public.handler_class_status(dog_id);
