
DO $$
DECLARE
  rec RECORD;
  v_text TEXT;
  v_class_type TEXT;
  v_result_status TEXT;
  v_pass_pct NUMERIC;
  v_period TEXT;
  v_handler_id UUID;
  v_dog_id UUID;
  v_inserted INT := 0;
  v_skipped INT := 0;
  v_columns TEXT[] := ARRAY['puppy_class','eo_class','bronze_cgc_class','silver_cgc_class','beginner_novice_class','wt_class','yoga_class','a_test_class'];
  v_class_types TEXT[] := ARRAY['Puppy','EO','CGC Bronze','CGC Silver','Beginner','WT','Yoga','A-Test'];
  v_col TEXT;
  v_idx INT;
BEGIN
  FOR rec IN
    SELECT ce.*, d.client_id
    FROM class_enrollments ce
    JOIN dogs d ON d.id = ce.dog_id
  LOOP
    v_handler_id := rec.client_id;
    v_dog_id := rec.dog_id;

    FOR v_idx IN 1..array_length(v_columns, 1) LOOP
      v_col := v_columns[v_idx];
      v_class_type := v_class_types[v_idx];

      v_text := CASE v_col
        WHEN 'puppy_class' THEN rec.puppy_class
        WHEN 'eo_class' THEN rec.eo_class
        WHEN 'bronze_cgc_class' THEN rec.bronze_cgc_class
        WHEN 'silver_cgc_class' THEN rec.silver_cgc_class
        WHEN 'beginner_novice_class' THEN rec.beginner_novice_class
        WHEN 'wt_class' THEN rec.wt_class
        WHEN 'yoga_class' THEN rec.yoga_class
        WHEN 'a_test_class' THEN rec.a_test_class
      END;

      IF v_text IS NULL OR trim(v_text) = '' THEN
        CONTINUE;
      END IF;

      v_text := trim(v_text);
      v_result_status := NULL;
      v_pass_pct := NULL;
      v_period := NULL;

      IF v_text ~ '[0-9]+[,.]?[0-9]*\s*%' THEN
        v_pass_pct := replace(
          (regexp_match(v_text, '([0-9]+[,.]?[0-9]*)\s*%'))[1],
          ',', '.'
        )::NUMERIC;

        IF v_pass_pct >= 60 THEN
          v_result_status := 'passed';
        ELSE
          v_result_status := 'no_pass';
        END IF;

        v_period := (regexp_match(v_text, '((?:Jan|Feb|Mar|March|Apr|April|May|Jun|June|Jul|July|Aug|Sep|Sept|Oct|Nov|Dec)\s*\d{2,4})', 'i'))[1];

      ELSIF v_text ~* '(passed|grad)' THEN
        v_result_status := 'passed';
        v_period := (regexp_match(v_text, '((?:Jan|Feb|Mar|March|Apr|April|May|Jun|June|Jul|July|Aug|Sep|Sept|Oct|Nov|Dec)\s*\d{2,4})', 'i'))[1];

      ELSIF v_text ~* '^completed$' THEN
        v_result_status := 'passed';

      ELSIF v_text ~* 'HD\s*Passed' THEN
        v_result_status := 'passed';

      ELSIF v_text ~* '(did\s*not\s*grade|dng)' THEN
        v_result_status := 'did_not_grade';

      ELSIF v_text ~* '(did\s*not\s*attend|\bdna\b)' THEN
        v_result_status := 'did_not_attend';

      ELSIF v_text ~* '(no\s*pass|fail|incomplete)' THEN
        v_result_status := 'no_pass';

      ELSE
        v_skipped := v_skipped + 1;
        CONTINUE;
      END IF;

      IF EXISTS (
        SELECT 1 FROM handler_class_status
        WHERE handler_id = v_handler_id
          AND dog_id = v_dog_id
          AND class_type = v_class_type
      ) THEN
        v_skipped := v_skipped + 1;
        CONTINUE;
      END IF;

      INSERT INTO handler_class_status (
        handler_id,
        dog_id,
        class_type,
        completed,
        completed_at,
        completion_method,
        result_status,
        pass_percentage,
        period,
        result_notes
      ) VALUES (
        v_handler_id,
        v_dog_id,
        v_class_type,
        true,
        now(),
        'legacy_backfill_v2',
        v_result_status,
        v_pass_pct,
        COALESCE(v_period, ''),
        'Source: ' || v_col || ' = "' || v_text || '"'
      );

      v_inserted := v_inserted + 1;

    END LOOP;
  END LOOP;

  RAISE NOTICE 'Legacy Backfill V2 complete: % inserted, % skipped', v_inserted, v_skipped;
END;
$$
