
-- Function to check if a column exists in a table
CREATE OR REPLACE FUNCTION public.check_column_exists(p_table text, p_column text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  column_exists boolean;
BEGIN
  SELECT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = p_table
    AND column_name = p_column
  ) INTO column_exists;
  
  RETURN column_exists;
END;
$$;
