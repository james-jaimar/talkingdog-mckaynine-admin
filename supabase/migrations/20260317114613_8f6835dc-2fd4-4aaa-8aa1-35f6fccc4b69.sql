
-- Step 1: Delete orphaned handler_tasks that reference legacy_backfill status records
DELETE FROM handler_tasks 
WHERE class_status_id IN (
  SELECT id FROM handler_class_status WHERE completion_method = 'legacy_backfill'
);

-- Step 2: Delete all legacy_backfill records from handler_class_status
DELETE FROM handler_class_status WHERE completion_method = 'legacy_backfill';
