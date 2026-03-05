
-- Create branch_email_signatures table
CREATE TABLE public.branch_email_signatures (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  branch_id uuid NOT NULL REFERENCES public.branches(id) ON DELETE CASCADE,
  name text NOT NULL,
  title text NOT NULL,
  phone text NOT NULL DEFAULT '',
  company text,
  email text NOT NULL,
  website text NOT NULL DEFAULT 'www.mckaynine.co.za',
  is_default boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.branch_email_signatures ENABLE ROW LEVEL SECURITY;

-- RLS policy: admins can do everything
CREATE POLICY "Admins can manage email signatures"
  ON public.branch_email_signatures
  FOR ALL
  TO authenticated
  USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'platform_admin'))
  WITH CHECK (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'platform_admin'));

-- Auto-update updated_at
CREATE TRIGGER update_branch_email_signatures_updated_at
  BEFORE UPDATE ON public.branch_email_signatures
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
