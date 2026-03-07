CREATE OR REPLACE FUNCTION public.delete_invoice_cascade(p_invoice_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_allocation RECORD;
BEGIN
  FOR v_allocation IN
    SELECT ska.id, ska.inventory_batch_id
    FROM starter_kit_allocations ska
    JOIN invoice_items ii ON ii.id = ska.invoice_item_id
    WHERE ii.invoice_id = p_invoice_id
  LOOP
    UPDATE starter_kit_inventory
    SET quantity_remaining = quantity_remaining + 1,
        updated_at = now()
    WHERE id = v_allocation.inventory_batch_id;
    DELETE FROM starter_kit_allocations WHERE id = v_allocation.id;
  END LOOP;
  DELETE FROM invoices WHERE id = p_invoice_id;
END;
$$