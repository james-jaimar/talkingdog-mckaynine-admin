
-- First, create the missing booking for Fagin in 15h00 Yoga January
INSERT INTO bookings (
  client_id,
  dog_id,
  class_schedule_id,
  is_enrolled,
  payment_status,
  status
) VALUES (
  '8d1a4fd4-dfad-454b-b549-8c1653741d78',  -- Allison Gilbert's client_id
  'dbdb3ff4-78ec-4f36-af12-de6a28665def',  -- Fagin's dog_id
  'cd1affe7-0236-4fe8-b148-a6bc180d6848',  -- 15h00 Yoga January schedule_id
  true,
  'pending',
  'confirmed'
);

-- Update Fagin's invoice item with the new booking_id
UPDATE invoice_items 
SET booking_id = (
  SELECT id FROM bookings 
  WHERE client_id = '8d1a4fd4-dfad-454b-b549-8c1653741d78' 
  AND dog_id = 'dbdb3ff4-78ec-4f36-af12-de6a28665def'
  AND class_schedule_id = 'cd1affe7-0236-4fe8-b148-a6bc180d6848'
  ORDER BY created_at DESC
  LIMIT 1
)
WHERE id = '71c5a55d-d0ac-4eda-a805-3340830d028b';

-- Update Jade Greve's invoice item with the correct booking_id
UPDATE invoice_items 
SET booking_id = '594a2c93-4b15-4db2-bb0c-b3e0cba38cf2',
    description = '15h00 Yoga January training class for Nugget'
WHERE id = '58be61cb-bea7-4da6-87a0-f40982d3f3f9'
