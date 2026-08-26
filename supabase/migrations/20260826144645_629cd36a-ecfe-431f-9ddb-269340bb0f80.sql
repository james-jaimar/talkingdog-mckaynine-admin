CREATE TABLE public.branch_info_packs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  branch_id uuid NOT NULL UNIQUE REFERENCES public.branches(id) ON DELETE CASCADE,
  is_published boolean NOT NULL DEFAULT true,
  hero_heading text NOT NULL DEFAULT 'Give your puppy the best start in life',
  hero_subheading text NOT NULL DEFAULT 'Build calmness, confidence and great habits from day one',
  hero_image_url text,
  trust_lines jsonb NOT NULL DEFAULT '[]'::jsonb,
  help_with jsonb NOT NULL DEFAULT '[]'::jsonb,
  start_age_note text,
  vaccination_note text,
  venue_name text,
  venue_time text,
  schedule_note text,
  fee_includes text,
  discount_note text,
  what_to_bring jsonb NOT NULL DEFAULT '[]'::jsonb,
  joining_steps jsonb NOT NULL DEFAULT '[]'::jsonb,
  banking_details text,
  cutoff_note text,
  directions jsonb NOT NULL DEFAULT '[]'::jsonb,
  map_link text,
  calls_note text,
  weather_note text,
  testimonial_quote text,
  testimonial_author text,
  contact_phone text,
  contact_email text,
  contact_website text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.branch_info_packs TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.branch_info_packs TO authenticated;
GRANT ALL ON public.branch_info_packs TO service_role;

ALTER TABLE public.branch_info_packs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Info packs are publicly readable"
  ON public.branch_info_packs FOR SELECT
  USING (true);

CREATE POLICY "Admins manage info packs"
  ON public.branch_info_packs FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'platform_admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'platform_admin'));

CREATE TRIGGER update_branch_info_packs_updated_at
  BEFORE UPDATE ON public.branch_info_packs
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

INSERT INTO public.branch_info_packs (
  branch_id, trust_lines, help_with, start_age_note, vaccination_note,
  venue_name, venue_time, schedule_note, fee_includes, discount_note,
  what_to_bring, joining_steps, banking_details, cutoff_note,
  directions, map_link, calls_note, weather_note,
  testimonial_quote, testimonial_author, contact_phone, contact_email, contact_website
) VALUES
(
  '6351a9e8-77db-403b-ab1f-cd47e393a006',
  '["Trusted by puppy owners since 1999","Recommended by vets, breeders & dog professionals"]'::jsonb,
  '["Nipping","Chewing","Social Manners","Lead Walking","Confidence","Toilet Training"]'::jsonb,
  'Puppies should start at 10 - 14 weeks old - we can sometimes make exceptions for small breeds on the upper age limit',
  'Pups MUST have had two vaccinations (latest from a vet) before starting classes',
  'Camp Delta (Scouts), Craighall Road, Delta Park',
  '15h00 - 16h00',
  'Missed the first class? Don''t worry - you can join from the second lesson.',
  'Includes the Puppy Owner''s Guide and a treat bag',
  '25% discount for simultaneous enrolment/s (excl. enrolment fee).',
  '["Puppy wearing a normal flat buckle collar","Light webbing lead (no chain or extendable leads please)","LOTS of small, soft treats (treats on sale at classes)","Towel or mat for your puppy to lie on","Comfortable flat shoes and a hat in warm weather"]'::jsonb,
  '["Complete the enrolment form below and upload a copy of your pup''s vaccination card","Submit a vet clearance letter only if your pup''s last vaccination was not from a vet (look for BVSc after the signature and a practice stamp in the vaccination book)","Email your proof of payment to delta@mckaynine.co.za"]'::jsonb,
  'A Hawkins t/a McKaynine Delta | FNB Sandton City | 6212 7520 189. Please use your name as the reference.',
  'Cut-off for enrolment is one business day before your first lesson. We''ll send you a booking confirmation once we have received your documents.',
  '["Use the main entrance of Delta Park at the end of Craighall Road","A few metres in is a little gravel road on the right","Take this gravel road right","Right again into the parking area","Please park along the fence line outside the camp area"]'::jsonb,
  'https://maps.google.com/?q=Camp+Delta+Delta+Park+Craighall+Road+Johannesburg',
  'Please note that we are normally in classes during the time you might be en route - we are thus unable to answer any calls.',
  'If the weather turns bad, classes will proceed UNLESS we reach out to reschedule the lesson.',
  'What stood out most was how personalised the training felt, even in a group class. I would highly recommend McKaynine Delta to anyone.',
  'Allison with Fagin',
  '083 400-2987',
  'delta@mckaynine.co.za',
  'www.mckaynine.co.za'
),
(
  '284817cf-de0d-43b9-a506-a3efa625ae1c',
  '["Trusted by puppy owners since 1999","Recommended by vets, breeders & dog professionals"]'::jsonb,
  '["Nipping","Chewing","Social Manners","Lead Walking","Confidence","Toilet Training"]'::jsonb,
  'Puppies should start at 10 - 14 weeks old - we can sometimes make exceptions for small breeds on the upper age limit',
  'Pups MUST have had two vaccinations (latest from a vet) before starting classes',
  'K9@Play, Randburg Sports Complex, Randburg',
  '09h00 - 10h00',
  'Six consecutive Friday lessons as per our schedule, starting after the second vaccination.',
  'Includes the Puppy Owner''s Guide and a treat bag',
  '25% discount for simultaneous enrolment/s (excl. enrolment fee).',
  '["Puppy wearing a normal flat buckle collar","Light webbing lead (no chain or extendable leads please)","LOTS of small, soft treats (treats on sale at classes)","Towel or mat for your puppy to lie on","Comfortable flat shoes and a hat in warm weather"]'::jsonb,
  '["Complete the enrolment form below and upload a copy of your pup''s vaccination card","Submit a vet clearance letter only if your pup''s last vaccination was not from a vet (look for BVSc after the signature and a practice stamp in the vaccination book)","Email your proof of payment to randburg@mckaynine.co.za"]'::jsonb,
  'A Hawkins t/a McKaynine Randburg | FNB Sandton City | 6212 7520 189. Please use your name as the reference.',
  'Cut-off for enrolment is one business day before your first lesson. We''ll send you a booking confirmation once we have received your documents.',
  '["Enter via the Randburg Sports Complex main gate","Follow the road towards the Dogs @ Play field","Parking is available alongside the training field"]'::jsonb,
  'https://maps.google.com/?q=Randburg+Sports+Complex+Randburg',
  'Please note that we are normally in classes during the time you might be en route - we are thus unable to answer any calls.',
  'If the weather turns bad, classes will proceed UNLESS we reach out to reschedule the lesson.',
  'I have been to a couple of dog training schools and McKaynine has been the best.',
  'Rhyan with Tenshi',
  '083 400-2987',
  'randburg@mckaynine.co.za',
  'www.mckaynine.co.za'
);