
CREATE OR REPLACE FUNCTION public.return_starter_kit(p_allocation_id uuid)
RETURNS TABLE(success boolean, remaining_total integer, message text)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_batch_id UUID;
BEGIN
  -- Get the batch ID from the allocation
  SELECT inventory_batch_id INTO v_batch_id
  FROM public.starter_kit_allocations
  WHERE id = p_allocation_id;

  IF v_batch_id IS NULL THEN
    RETURN QUERY SELECT false, 0, 'Allocation not found'::TEXT;
    RETURN;
  END IF;

  -- Increment stock back
  UPDATE public.starter_kit_inventory
  SET quantity_remaining = quantity_remaining + 1,
      updated_at = now()
  WHERE id = v_batch_id;

  -- Delete the allocation record
  DELETE FROM public.starter_kit_allocations
  WHERE id = p_allocation_id;

  -- Get total remaining
  RETURN QUERY SELECT true, 
    (SELECT COALESCE(SUM(quantity_remaining), 0)::INTEGER FROM public.starter_kit_inventory),
    'Starter kit returned to stock'::TEXT;
END;
$$;
