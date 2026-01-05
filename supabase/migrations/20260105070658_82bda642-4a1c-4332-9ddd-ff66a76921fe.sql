
-- Fix the 3 Term 2 classes that had corrupted trainer fee values
UPDATE classes 
SET trainer_fee_value = 40, trainer_fee_type = 'percentage'
WHERE id IN (
  '0b1cb78b-b05b-4b4d-b337-ce30557cd05e',
  'e5326953-8e52-4b04-ab0f-640c7db7025c', 
  '32cb8f11-8682-4f9a-a8b6-5d59f254fea7'
);
