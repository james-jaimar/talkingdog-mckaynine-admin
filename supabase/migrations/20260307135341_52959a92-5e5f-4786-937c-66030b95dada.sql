
-- One-time backfill: migrate legacy class_enrollments data into handler_class_status
-- This processes free-text values and maps them to structured statuses

DO $$
DECLARE
  rec RECORD;
  v_handler_id uuid;
  v_dog_id uuid;
  v_class_type text;
  v_raw_value text;
  v_status text;
  v_percentage numeric;
  v_period text;
  v_lower text;
  v_pct_match text[];
  v_period_match text[];
  col_names text[] := ARRAY['puppy_class', 'eo_class', 'bronze_cgc_class', 'silver_cgc_class', 'beginner_novice_class', 'wt_class', 'yoga_class'];
  class_type_names text[] := ARRAY['Puppy', 'EO', 'CGC Bronze', 'CGC Silver', 'Beginner', 'WT', 'Yoga'];
  i int;
  v_exists boolean;
BEGIN
  FOR rec IN 
    SELECT ce.id, ce.dog_id, 
           ce.puppy_class, ce.eo_class, ce.bronze_cgc_class, 
           ce.silver_cgc_class, ce.beginner_novice_class, ce.wt_class, ce.yoga_class,
           d.client_id
    FROM class_enrollments ce
    JOIN dogs d ON d.id = ce.dog_id
  LOOP
    v_handler_id := rec.client_id;
    v_dog_id := rec.dog_id;
    
    FOR i IN 1..7 LOOP
      v_class_type := class_type_names[i];
      
      -- Get the raw value for this column
      CASE i
        WHEN 1 THEN v_raw_value := rec.puppy_class;
        WHEN 2 THEN v_raw_value := rec.eo_class;
        WHEN 3 THEN v_raw_value := rec.bronze_cgc_class;
        WHEN 4 THEN v_raw_value := rec.silver_cgc_class;
        WHEN 5 THEN v_raw_value := rec.beginner_novice_class;
        WHEN 6 THEN v_raw_value := rec.wt_class;
        WHEN 7 THEN v_raw_value := rec.yoga_class;
      END CASE;
      
      -- Skip null/empty values
      IF v_raw_value IS NULL OR trim(v_raw_value) = '' THEN
        CONTINUE;
      END IF;
      
      -- Check if record already exists
      SELECT EXISTS(
        SELECT 1 FROM handler_class_status 
        WHERE handler_id = v_handler_id 
          AND class_type = v_class_type 
          AND dog_id = v_dog_id
      ) INTO v_exists;
      
      IF v_exists THEN
        CONTINUE;
      END IF;
      
      v_lower := lower(trim(v_raw_value));
      v_status := NULL;
      v_percentage := NULL;
      v_period := NULL;
      
      -- Extract percentage: patterns like "93,5%", "55%", "93.5%"
      IF v_raw_value ~ '(\d+[,.]?\d*)\s*%' THEN
        v_pct_match := regexp_match(v_raw_value, '(\d+[,.]?\d*)\s*%');
        IF v_pct_match IS NOT NULL THEN
          v_percentage := replace(v_pct_match[1], ',', '.')::numeric;
        END IF;
      END IF;
      
      -- Extract period: patterns like "Mar 24", "March 25", "Sep 2025", "Mar24"
      IF v_raw_value ~* '(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)\w*\s*(\d{2,4})' THEN
        v_period_match := regexp_match(v_raw_value, '((?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\w*)\s*(\d{2,4})', 'i');
        IF v_period_match IS NOT NULL THEN
          v_period := v_period_match[1] || ' ' || v_period_match[2];
        END IF;
      END IF;
      
      -- Determine status
      IF v_lower ~ 'did not grade' OR v_lower ~ 'did_not_grade' OR v_lower ~ 'dng' THEN
        v_status := 'did_not_grade';
      ELSIF v_lower ~ 'did not attend' OR v_lower ~ 'did_not_attend' OR v_lower ~ 'dna' THEN
        v_status := 'did_not_attend';
      ELSIF v_lower ~ 'incomplete' THEN
        v_status := 'incomplete';
      ELSIF v_lower ~ 'no pass' OR v_lower ~ 'no_pass' OR v_lower ~ 'not pass' OR v_lower ~ 'fail' THEN
        v_status := 'no_pass';
      ELSIF v_percentage IS NOT NULL THEN
        IF v_percentage >= 60 THEN
          v_status := 'passed';
        ELSE
          v_status := 'no_pass';
        END IF;
      ELSIF v_lower ~ 'pass' THEN
        v_status := 'passed';
      ELSIF v_lower ~ 'current' OR v_lower ~ 'enrolled' THEN
        v_status := 'completed';
      ELSIF v_lower ~ 'interested' THEN
        v_status := 'interested';
      ELSIF v_lower ~ 'not.interested' OR v_lower ~ 'not interested' THEN
        v_status := 'not-interested';
      ELSE
        -- Unknown format - store with completed status so it shows up
        v_status := 'completed';
      END IF;
      
      -- Insert the record
      INSERT INTO handler_class_status (
        handler_id, class_type, dog_id, 
        result_status, pass_percentage, period, result_notes,
        completed, completed_at, completion_method
      ) VALUES (
        v_handler_id, v_class_type, v_dog_id,
        v_status, v_percentage, v_period, 'Legacy: ' || v_raw_value,
        true, now(), 'legacy_backfill'
      );
      
    END LOOP;
  END LOOP;
END $$;
