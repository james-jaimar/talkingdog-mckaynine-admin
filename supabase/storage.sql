
-- Create a bucket for payment documents if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('payment-documents', 'payment-documents', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- Add RLS policies for the payment-documents bucket
CREATE POLICY "Allow public viewing of payment documents" 
ON storage.objects
FOR SELECT
TO authenticated, anon
USING (bucket_id = 'payment-documents');

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
