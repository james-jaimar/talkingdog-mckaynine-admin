-- Fix existing handler_class_status records with incorrect period values
-- Update them with the correct "Mon YY" format based on the last class date

UPDATE handler_class_status hcs
SET period = TO_CHAR(
  (
    SELECT MAX(unnested_date::timestamp)
    FROM class_schedules cs,
    LATERAL unnest(cs.selected_dates) AS unnested_date
    WHERE cs.class_id = hcs.class_id
  ),
  'Mon YY'
)
WHERE hcs.period IS NULL 
   OR hcs.period = 'Current term'
   OR hcs.period LIKE 'Term%';