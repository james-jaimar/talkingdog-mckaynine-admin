
-- Create a bucket for payment documents if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('payment-documents', 'payment-documents', false)
ON CONFLICT (id) DO NOTHING;

-- Add RLS policies for the payment-documents bucket
CREATE POLICY "Allow payment document viewing by admins" 
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'payment-documents' AND 
  (
    auth.role() = 'service_role' OR
    EXISTS (
      SELECT 1 FROM auth.users
      JOIN public.profiles ON auth.users.id = public.profiles.id
      WHERE auth.users.id = auth.uid() AND public.profiles.role = 'admin'
    )
  )
);

CREATE POLICY "Allow payment document creation by admin" 
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'payment-documents' AND 
  (
    auth.role() = 'service_role' OR
    EXISTS (
      SELECT 1 FROM auth.users
      JOIN public.profiles ON auth.users.id = public.profiles.id
      WHERE auth.users.id = auth.uid() AND public.profiles.role = 'admin'
    )
  )
);
