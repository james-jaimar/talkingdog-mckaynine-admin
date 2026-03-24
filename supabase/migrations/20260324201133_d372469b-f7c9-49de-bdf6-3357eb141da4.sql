CREATE OR REPLACE FUNCTION public.get_term_id_for_month(month_str text)
RETURNS uuid
LANGUAGE plpgsql STABLE
SET search_path = public
AS $$
DECLARE
  month_date date;
  result_id uuid;
BEGIN
  month_date := (month_str || '-01')::date;
  
  SELECT t.id INTO result_id
  FROM public.terms t
  JOIN public.academic_years ay ON ay.id = t.academic_year_id
  WHERE month_date BETWEEN t.start_date AND t.end_date
  LIMIT 1;
  
  RETURN result_id;
END;
$$;