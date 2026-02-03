-- Add 'assistant' to the app_role enum
-- This needs to be in a separate transaction from using the enum value
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'assistant';