
-- Backfill dog_id on handler_class_status for single-dog handlers
-- Skip rows that would violate the unique constraint
UPDATE handler_class_status hcs
SET dog_id = sub.dog_id
FROM (
  SELECT c.id AS client_id, MIN(d.id::text)::uuid AS dog_id
  FROM clients c
  JOIN dogs d ON d.client_id = c.id
  GROUP BY c.id
  HAVING COUNT(d.id) = 1
) sub
WHERE hcs.handler_id = sub.client_id
  AND hcs.dog_id IS NULL
  AND NOT EXISTS (
    SELECT 1 FROM handler_class_status existing
    WHERE existing.handler_id = hcs.handler_id
      AND existing.class_type = hcs.class_type
      AND existing.dog_id = sub.dog_id
      AND existing.period = hcs.period
  );
