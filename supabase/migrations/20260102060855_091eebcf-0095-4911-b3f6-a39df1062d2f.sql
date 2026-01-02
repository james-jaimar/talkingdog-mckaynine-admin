-- Add missing columns to clients table
ALTER TABLE public.clients 
ADD COLUMN IF NOT EXISTS occupation text,
ADD COLUMN IF NOT EXISTS vet_name text,
ADD COLUMN IF NOT EXISTS account_holder_name text;

-- Add missing columns to dogs table
ALTER TABLE public.dogs 
ADD COLUMN IF NOT EXISTS gender text,
ADD COLUMN IF NOT EXISTS spay_neuter_status text,
ADD COLUMN IF NOT EXISTS acquired_from text,
ADD COLUMN IF NOT EXISTS acquired_from_other text,
ADD COLUMN IF NOT EXISTS age_at_acquisition text,
ADD COLUMN IF NOT EXISTS other_pets jsonb DEFAULT '{}',
ADD COLUMN IF NOT EXISTS children_at_home text,
ADD COLUMN IF NOT EXISTS social_behavior jsonb DEFAULT '{}',
ADD COLUMN IF NOT EXISTS social_behavior_details text,
ADD COLUMN IF NOT EXISTS training_goal text,
ADD COLUMN IF NOT EXISTS has_behavior_problems boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS behavior_problems_details text,
ADD COLUMN IF NOT EXISTS has_health_problems boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS health_problems_details text;

-- Create enrollment_registrations table
CREATE TABLE public.enrollment_registrations (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id uuid NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  dog_id uuid NOT NULL REFERENCES public.dogs(id) ON DELETE CASCADE,
  class_schedule_id uuid REFERENCES public.class_schedules(id),
  branch_id uuid NOT NULL REFERENCES public.branches(id),
  class_type text NOT NULL,
  class_type_other text,
  heard_from jsonb DEFAULT '{}',
  whatsapp_permission text DEFAULT 'unsure',
  photo_permission text DEFAULT 'unsure',
  onlead_socializing_acknowledged boolean DEFAULT false,
  equipment_supervision_acknowledged boolean DEFAULT false,
  training_equipment_acknowledged boolean DEFAULT false,
  treats_acknowledged boolean DEFAULT false,
  waste_disposal_acknowledged boolean DEFAULT false,
  terms_agreed boolean DEFAULT false,
  vet_clearance_url text,
  signature_name text,
  signature_data text,
  signature_date date,
  privacy_policy_agreed boolean DEFAULT false,
  status text DEFAULT 'draft',
  submitted_at timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS on enrollment_registrations
ALTER TABLE public.enrollment_registrations ENABLE ROW LEVEL SECURITY;

-- RLS policies for enrollment_registrations
CREATE POLICY "Staff can view all enrollment registrations"
ON public.enrollment_registrations
FOR SELECT
USING (EXISTS (
  SELECT 1 FROM profiles
  WHERE profiles.id = auth.uid() 
  AND (profiles.role = 'admin' OR profiles.role = 'trainer')
));

CREATE POLICY "Staff can insert enrollment registrations"
ON public.enrollment_registrations
FOR INSERT
WITH CHECK (EXISTS (
  SELECT 1 FROM profiles
  WHERE profiles.id = auth.uid() 
  AND (profiles.role = 'admin' OR profiles.role = 'trainer')
));

CREATE POLICY "Staff can update enrollment registrations"
ON public.enrollment_registrations
FOR UPDATE
USING (EXISTS (
  SELECT 1 FROM profiles
  WHERE profiles.id = auth.uid() 
  AND (profiles.role = 'admin' OR profiles.role = 'trainer')
));

CREATE POLICY "Staff can delete enrollment registrations"
ON public.enrollment_registrations
FOR DELETE
USING (EXISTS (
  SELECT 1 FROM profiles
  WHERE profiles.id = auth.uid() 
  AND profiles.role = 'admin'
));

-- Create updated_at trigger for enrollment_registrations
CREATE TRIGGER update_enrollment_registrations_updated_at
BEFORE UPDATE ON public.enrollment_registrations
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create storage bucket for vet clearance documents
INSERT INTO storage.buckets (id, name, public)
VALUES ('vet-clearance-docs', 'vet-clearance-docs', false)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for vet-clearance-docs bucket
CREATE POLICY "Staff can view vet clearance docs"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'vet-clearance-docs' AND
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid() 
    AND (profiles.role = 'admin' OR profiles.role = 'trainer')
  )
);

CREATE POLICY "Staff can upload vet clearance docs"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'vet-clearance-docs' AND
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid() 
    AND (profiles.role = 'admin' OR profiles.role = 'trainer')
  )
);

CREATE POLICY "Staff can delete vet clearance docs"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'vet-clearance-docs' AND
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid() 
    AND profiles.role = 'admin'
  )
);