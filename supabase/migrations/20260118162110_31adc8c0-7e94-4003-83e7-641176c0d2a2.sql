-- Fix cross-branch booking: Move client "Jane & Richard" from Delta to Randburg
-- The client was incorrectly assigned to Delta but has a booking in a Randburg class (09h00 Puppy)

UPDATE public.clients 
SET branch_id = '284817cf-de0d-43b9-a506-a3efa625ae1c'  -- Randburg branch
WHERE id = 'a493b842-30a8-4f47-b80a-cac55f97cdb6'      -- Jane & Richard
  AND branch_id = '6351a9e8-77db-403b-ab1f-cd47e393a006';  -- Only if currently Delta (safety check)