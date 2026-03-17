-- Duplicate Cleanup: Remove 11 duplicate handler_class_status records
-- Category 1: 5 NULL-dog records that duplicate records WITH dog_id (same handler, class_type, percentage, period)
-- Category 2: 6 double-click Yoga entries (later-created duplicate of identical record)

DELETE FROM handler_class_status
WHERE id IN (
  -- Category 1: NULL-dog duplicates (keep the one with dog_id)
  '82711e3d-0d4c-4f8d-96d9-36e38d4a44fe',  -- Angela Glover EO 81.5%
  '588225b8-2d8c-4f2c-a016-607418ad3651',  -- Angela Glover EO 61%
  '76361e7c-dcaa-42a5-b1c6-620b4c614510',  -- Duncan Miller Beginner 64.5%
  '452116e5-51cb-439a-8ca7-189cab403e88',  -- Jackie Dickson Novice 70.5%
  '785ca41a-b9c2-43c6-a4e6-c425bf73dbae',  -- Michael Rogans EO 91.5%
  -- Category 2: Double-click Yoga duplicates (keep earlier-created)
  '9d0f4f0f-f4f3-4e3c-8444-e34b62e86fc4',  -- Joy/Sharise Yoga Feb 26
  '4684ed79-f4da-42ba-baf9-e10f1a89b9aa',  -- Allison Gilbert Yoga Feb 26
  'fb302ff0-d410-416e-8d92-4eabcab8d9d0',  -- Allison Gilbert Yoga Jan 26
  'b63cba1e-a247-43f2-a6b1-cf960f780b07',  -- Joy/Sharise Yoga Jan 26
  '35115cdd-afac-4f40-9b95-358e9ce01fcb',  -- Joy/Sharise Yoga Mar 26
  '1db89931-fe13-4c32-a8da-f3d1b05ed2ee'   -- Allison Gilbert Yoga Mar 26
);