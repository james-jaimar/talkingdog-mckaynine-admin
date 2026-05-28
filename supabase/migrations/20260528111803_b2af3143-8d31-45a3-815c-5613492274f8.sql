
CREATE TABLE public.google_form_submissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  received_at timestamptz NOT NULL DEFAULT now(),
  source text NOT NULL,
  raw_payload jsonb NOT NULL,
  submitted_at timestamptz,
  email text,
  status text NOT NULL DEFAULT 'received',
  error_message text,
  client_id uuid,
  dog_ids uuid[] DEFAULT '{}',
  enrollment_ids uuid[] DEFAULT '{}',
  branch_id uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.google_form_submissions TO authenticated;
GRANT ALL ON public.google_form_submissions TO service_role;

ALTER TABLE public.google_form_submissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view google form submissions"
ON public.google_form_submissions FOR SELECT TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'platform_admin'::app_role));

CREATE POLICY "Admins can update google form submissions"
ON public.google_form_submissions FOR UPDATE TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'platform_admin'::app_role));

CREATE POLICY "Admins can delete google form submissions"
ON public.google_form_submissions FOR DELETE TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'platform_admin'::app_role));

CREATE INDEX idx_gfs_received_at ON public.google_form_submissions(received_at DESC);
CREATE INDEX idx_gfs_status ON public.google_form_submissions(status);
CREATE INDEX idx_gfs_email ON public.google_form_submissions(lower(email));

CREATE TRIGGER trg_gfs_updated_at
BEFORE UPDATE ON public.google_form_submissions
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
