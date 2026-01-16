-- Add secondary contact fields to clients table
ALTER TABLE clients 
ADD COLUMN secondary_first_name TEXT,
ADD COLUMN secondary_last_name TEXT,
ADD COLUMN secondary_email TEXT,
ADD COLUMN secondary_phone TEXT;