
ALTER TABLE starter_kit_allocations
  DROP CONSTRAINT starter_kit_allocations_invoice_item_id_fkey;

ALTER TABLE starter_kit_allocations
  ADD CONSTRAINT starter_kit_allocations_invoice_item_id_fkey
  FOREIGN KEY (invoice_item_id)
  REFERENCES invoice_items(id)
  ON DELETE SET NULL;
