ALTER TABLE public.enrollment_registrations
  ADD COLUMN IF NOT EXISTS privacy_notice_version text,
  ADD COLUMN IF NOT EXISTS privacy_notice_accepted_at timestamptz;

COMMENT ON COLUMN public.enrollment_registrations.privacy_notice_version IS
  'Version of the just-in-time privacy notice shown to the data subject.';
COMMENT ON COLUMN public.enrollment_registrations.privacy_notice_accepted_at IS
  'Server-recorded time at which the accepted enrolment was submitted.';