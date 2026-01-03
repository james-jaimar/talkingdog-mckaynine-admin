-- Create scan_processing_jobs table for tracking uploaded scans
CREATE TABLE public.scan_processing_jobs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  filename text NOT NULL,
  file_url text NOT NULL,
  status text NOT NULL DEFAULT 'queued',
  page_count integer,
  extracted_data jsonb,
  field_confidence jsonb,
  notes_for_review text[],
  matched_client_id uuid REFERENCES public.clients(id),
  created_dog_ids uuid[],
  enrollment_ids uuid[],
  error_message text,
  uploaded_by uuid,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Add constraint to validate status values
ALTER TABLE public.scan_processing_jobs 
ADD CONSTRAINT scan_processing_jobs_status_check 
CHECK (status IN ('queued', 'processing', 'needs_review', 'ready_to_save', 'saved', 'error'));

-- Enable Row Level Security
ALTER TABLE public.scan_processing_jobs ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Only admins can manage scan jobs
CREATE POLICY "Admins can manage scan jobs" ON public.scan_processing_jobs
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() 
      AND role IN ('admin', 'platform_admin')
    )
    OR has_role(auth.uid(), 'admin'::app_role)
    OR has_role(auth.uid(), 'platform_admin'::app_role)
  );

-- Create updated_at trigger
CREATE TRIGGER update_scan_processing_jobs_updated_at
  BEFORE UPDATE ON public.scan_processing_jobs
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create storage bucket for scanned forms
INSERT INTO storage.buckets (id, name, public)
VALUES ('scanned-forms', 'scanned-forms', false)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for scanned-forms bucket
CREATE POLICY "Admins can upload scanned forms" 
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'scanned-forms' AND 
  (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() 
      AND role IN ('admin', 'platform_admin')
    )
    OR has_role(auth.uid(), 'admin'::app_role)
    OR has_role(auth.uid(), 'platform_admin'::app_role)
  )
);

CREATE POLICY "Admins can view scanned forms" 
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'scanned-forms' AND 
  (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() 
      AND role IN ('admin', 'platform_admin')
    )
    OR has_role(auth.uid(), 'admin'::app_role)
    OR has_role(auth.uid(), 'platform_admin'::app_role)
  )
);

CREATE POLICY "Admins can delete scanned forms" 
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'scanned-forms' AND 
  (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() 
      AND role IN ('admin', 'platform_admin')
    )
    OR has_role(auth.uid(), 'admin'::app_role)
    OR has_role(auth.uid(), 'platform_admin'::app_role)
  )
);