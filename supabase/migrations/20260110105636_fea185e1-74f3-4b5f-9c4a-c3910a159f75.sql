-- Bulk update all existing handlers to have both verification fields set to true
UPDATE public.clients
SET 
  enrollment_verified = true,
  vaccination_verified = true,
  updated_at = now();