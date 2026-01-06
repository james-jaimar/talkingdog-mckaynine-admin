-- Delete duplicate handler_class_status records, keeping only the most recent one
DELETE FROM handler_class_status h1
WHERE h1.id NOT IN (
  SELECT DISTINCT ON (handler_id, class_type) id
  FROM handler_class_status
  ORDER BY handler_id, class_type, created_at DESC NULLS LAST, id
);

-- Add unique constraint for handler_class_status upsert operations
ALTER TABLE public.handler_class_status 
ADD CONSTRAINT handler_class_status_handler_id_class_type_key 
UNIQUE (handler_id, class_type);