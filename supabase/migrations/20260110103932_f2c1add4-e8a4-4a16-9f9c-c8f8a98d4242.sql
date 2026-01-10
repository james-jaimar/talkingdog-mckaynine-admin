-- Add admin verification fields at the handler (client) level
ALTER TABLE public.clients 
ADD COLUMN IF NOT EXISTS enrollment_verified boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS vaccination_verified boolean DEFAULT false;