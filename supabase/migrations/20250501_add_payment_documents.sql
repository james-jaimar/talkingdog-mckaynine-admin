
-- Add document URL and name columns to trainer_payments table
ALTER TABLE IF EXISTS public.trainer_payments
ADD COLUMN IF NOT EXISTS document_url TEXT,
ADD COLUMN IF NOT EXISTS document_name TEXT;

-- Create payment-documents bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
SELECT 'payment-documents', 'payment-documents', false
WHERE NOT EXISTS (
    SELECT 1 FROM storage.buckets WHERE id = 'payment-documents'
);

-- Create RLS policy to allow authenticated users to upload to the payment-documents bucket
CREATE POLICY "Allow authenticated users to upload payment documents" 
ON storage.objects 
FOR INSERT 
TO authenticated 
WITH CHECK (bucket_id = 'payment-documents');

-- Create RLS policy to allow authenticated users to read from the payment-documents bucket
CREATE POLICY "Allow authenticated users to read payment documents" 
ON storage.objects 
FOR SELECT 
TO authenticated 
USING (bucket_id = 'payment-documents');
