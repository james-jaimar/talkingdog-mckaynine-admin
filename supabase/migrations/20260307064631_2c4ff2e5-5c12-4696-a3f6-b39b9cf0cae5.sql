
-- Phase 1: Create class_types lookup table
CREATE TABLE public.class_types (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text UNIQUE NOT NULL,
  display_order integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.class_types ENABLE ROW LEVEL SECURITY;

-- Admins can do everything
CREATE POLICY "Admins can manage class types"
  ON public.class_types FOR ALL
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- All authenticated users can read (for dropdowns, handler table etc)
CREATE POLICY "Authenticated users can read class types"
  ON public.class_types FOR SELECT
  TO authenticated
  USING (true);

-- Anonymous can also read (for public enrollment form)
CREATE POLICY "Anonymous can read class types"
  ON public.class_types FOR SELECT
  TO anon
  USING (true);

-- Seed with existing enum values in canonical order
INSERT INTO public.class_types (name, display_order) VALUES
  ('Puppy', 1),
  ('EO', 2),
  ('CGC Bronze', 3),
  ('CGC Silver', 4),
  ('Beginner', 5),
  ('Novice', 6),
  ('WT', 7),
  ('A-Test', 8),
  ('Yoga', 9);

-- Phase 2: Convert classes.class_type from enum to text
ALTER TABLE public.classes
  ALTER COLUMN class_type TYPE text USING class_type::text;

-- Drop the old enum type
DROP TYPE IF EXISTS public.class_type;
