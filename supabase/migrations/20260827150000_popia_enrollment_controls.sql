-- POPIA evidence and storage hardening for puppy-class enrolments.

ALTER TABLE public.enrollment_registrations
  ADD COLUMN IF NOT EXISTS privacy_notice_version text,
  ADD COLUMN IF NOT EXISTS privacy_notice_accepted_at timestamptz;

COMMENT ON COLUMN public.enrollment_registrations.privacy_notice_version IS
  'Version of the just-in-time privacy notice shown to the data subject.';
COMMENT ON COLUMN public.enrollment_registrations.privacy_notice_accepted_at IS
  'Server-recorded time at which the accepted enrolment was submitted.';

UPDATE storage.buckets
SET public = false,
    file_size_limit = 10485760,
    allowed_mime_types = ARRAY['application/pdf', 'image/jpeg', 'image/png', 'image/webp']
WHERE id = 'vet-clearance-docs';

