-- Create storage bucket for vet clearance documents
INSERT INTO storage.buckets (id, name, public)
VALUES ('vet-clearance-docs', 'vet-clearance-docs', false)
ON CONFLICT (id) DO NOTHING;

-- RLS Policy: Authenticated users can upload to their own folder
CREATE POLICY "Users can upload vet clearance docs to own folder"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'vet-clearance-docs' 
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- RLS Policy: Users can view their own documents
CREATE POLICY "Users can view own vet clearance docs"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'vet-clearance-docs' 
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- RLS Policy: Users can update their own documents
CREATE POLICY "Users can update own vet clearance docs"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'vet-clearance-docs' 
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- RLS Policy: Users can delete their own documents
CREATE POLICY "Users can delete own vet clearance docs"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'vet-clearance-docs' 
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- RLS Policy: Admins can view all vet clearance docs
CREATE POLICY "Admins can view all vet clearance docs"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'vet-clearance-docs'
  AND EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_roles.user_id = auth.uid() 
    AND user_roles.role IN ('admin', 'platform_admin')
  )
);