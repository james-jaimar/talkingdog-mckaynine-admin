
-- Create branch_class_types junction table
CREATE TABLE public.branch_class_types (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  branch_id uuid NOT NULL REFERENCES public.branches(id) ON DELETE CASCADE,
  class_type_id uuid NOT NULL REFERENCES public.class_types(id) ON DELETE CASCADE,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(branch_id, class_type_id)
);

-- Enable RLS
ALTER TABLE public.branch_class_types ENABLE ROW LEVEL SECURITY;

-- Admins can CRUD
CREATE POLICY "Admins can manage branch class types"
  ON public.branch_class_types
  FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Authenticated can SELECT
CREATE POLICY "Authenticated users can read branch class types"
  ON public.branch_class_types
  FOR SELECT
  TO authenticated
  USING (true);

-- Anonymous can SELECT (for public enrollment form)
CREATE POLICY "Anonymous can read branch class types"
  ON public.branch_class_types
  FOR SELECT
  TO anon
  USING (true);

-- Seed: for each branch, insert a row for every class type, copying global is_active
INSERT INTO public.branch_class_types (branch_id, class_type_id, is_active)
SELECT b.id, ct.id, ct.is_active
FROM public.branches b
CROSS JOIN public.class_types ct;

-- Remove global is_active from class_types (no longer needed)
ALTER TABLE public.class_types DROP COLUMN is_active;
