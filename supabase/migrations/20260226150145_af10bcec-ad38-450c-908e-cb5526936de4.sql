
-- Return Sally Buitendag's starter kit to stock
UPDATE starter_kit_inventory
SET quantity_remaining = quantity_remaining + 1, updated_at = now()
WHERE id = '6f713ab5-60b8-4b25-b700-6f4373112a6b';

-- Remove the allocation record
DELETE FROM starter_kit_allocations
WHERE id = '0fc66cd1-e494-42b8-a352-6cd3c7d171a2';
