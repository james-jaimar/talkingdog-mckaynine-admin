ALTER TABLE public.branch_info_packs
  ADD COLUMN IF NOT EXISTS logo_url text,
  ADD COLUMN IF NOT EXISTS map_image_url text,
  ADD COLUMN IF NOT EXISTS missed_class_note text,
  ADD COLUMN IF NOT EXISTS before_enrol_notes jsonb NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS start_notes jsonb NOT NULL DEFAULT '[]'::jsonb;

UPDATE public.branch_info_packs p
SET missed_class_note = COALESCE(p.missed_class_note, 'Missed the first class? Don''t worry - you can join from the second lesson.'),
    before_enrol_notes = CASE WHEN p.before_enrol_notes = '[]'::jsonb THEN
      to_jsonb(ARRAY[COALESCE(p.cutoff_note, 'Cut-off is one business day before the first lesson.'), 'Booking confirmation is sent after we receive your documents.'])
      ELSE p.before_enrol_notes END,
    start_notes = CASE WHEN p.start_notes = '[]'::jsonb THEN
      to_jsonb(ARRAY_REMOVE(ARRAY[p.start_age_note, p.vaccination_note], NULL))
      ELSE p.start_notes END;