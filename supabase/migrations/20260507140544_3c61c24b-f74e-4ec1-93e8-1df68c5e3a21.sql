-- Allow anonymous and authenticated users to upload vet clearance docs ONLY under the 'public/' prefix
CREATE POLICY "Public can upload vet clearance to public folder"
ON storage.objects
FOR INSERT
TO anon, authenticated
WITH CHECK (
  bucket_id = 'vet-clearance-docs'
  AND (storage.foldername(name))[1] = 'public'
);