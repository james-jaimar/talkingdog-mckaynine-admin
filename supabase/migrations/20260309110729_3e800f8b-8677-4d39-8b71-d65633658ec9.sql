CREATE OR REPLACE FUNCTION public.set_term_details_trigger()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  term_info record;
  selected_term record;
  first_date date;
BEGIN
  -- If term_id is explicitly provided by the caller, trust it and derive metadata from it.
  IF NEW.term_id IS NOT NULL THEN
    SELECT t.term_number, ay.year
    INTO selected_term
    FROM public.terms t
    JOIN public.academic_years ay ON ay.id = t.academic_year_id
    WHERE t.id = NEW.term_id;

    IF NOT FOUND THEN
      RAISE EXCEPTION 'Invalid term_id provided for class_schedules: %', NEW.term_id
        USING ERRCODE = '23503';
    END IF;

    NEW.term_number := selected_term.term_number;
    NEW.academic_year := selected_term.year;

    RETURN NEW;
  END IF;

  -- Backward-compatible fallback for legacy flows that do not provide term_id.
  IF NEW.selected_dates IS NOT NULL AND array_length(NEW.selected_dates, 1) > 0 THEN
    first_date := (NEW.selected_dates[1])::date;
  ELSE
    first_date := NEW.start_time::date;
  END IF;

  SELECT * INTO term_info FROM public.determine_term_from_date(first_date);

  NEW.term_number := term_info.term_number;
  NEW.academic_year := term_info.academic_year;

  SELECT t.id
  INTO NEW.term_id
  FROM public.terms t
  JOIN public.academic_years ay ON ay.id = t.academic_year_id
  WHERE t.term_number = term_info.term_number
    AND ay.year = term_info.academic_year
  LIMIT 1;

  IF NEW.term_id IS NULL THEN
    RAISE EXCEPTION 'No matching term found for inferred term_number % and academic_year %', term_info.term_number, term_info.academic_year
      USING ERRCODE = '23503';
  END IF;

  RETURN NEW;
END;
$$;

UPDATE public.class_schedules
SET term_id = 'c7951cbb-de96-47b1-bf05-69b512b7f5da'
WHERE class_id = '5cf8a7a4-912a-4e3e-bc5e-6e31b59f8262'
  AND term_id = 'af8f86a4-6a26-4415-be4d-b388d7e942c1';