-- Create starter_kit_inventory table (global/app-level stock)
CREATE TABLE public.starter_kit_inventory (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  quantity_added INTEGER NOT NULL CHECK (quantity_added > 0),
  quantity_remaining INTEGER NOT NULL DEFAULT 0,
  purchase_date DATE NOT NULL DEFAULT CURRENT_DATE,
  unit_cost NUMERIC(10,2),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create starter_kit_allocations table (tracks which branch used each kit)
CREATE TABLE public.starter_kit_allocations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  inventory_batch_id UUID NOT NULL REFERENCES public.starter_kit_inventory(id) ON DELETE CASCADE,
  branch_id UUID REFERENCES public.branches(id),
  invoice_item_id UUID REFERENCES public.invoice_items(id),
  handler_id UUID REFERENCES public.clients(id),
  dog_name TEXT,
  allocated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.starter_kit_inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.starter_kit_allocations ENABLE ROW LEVEL SECURITY;

-- RLS policies for starter_kit_inventory (admin-only)
CREATE POLICY "Admins can view starter kit inventory"
ON public.starter_kit_inventory
FOR SELECT
USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'platform_admin'));

CREATE POLICY "Admins can insert starter kit inventory"
ON public.starter_kit_inventory
FOR INSERT
WITH CHECK (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'platform_admin'));

CREATE POLICY "Admins can update starter kit inventory"
ON public.starter_kit_inventory
FOR UPDATE
USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'platform_admin'));

CREATE POLICY "Admins can delete starter kit inventory"
ON public.starter_kit_inventory
FOR DELETE
USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'platform_admin'));

-- RLS policies for starter_kit_allocations (admin-only)
CREATE POLICY "Admins can view starter kit allocations"
ON public.starter_kit_allocations
FOR SELECT
USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'platform_admin'));

CREATE POLICY "Admins can insert starter kit allocations"
ON public.starter_kit_allocations
FOR INSERT
WITH CHECK (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'platform_admin'));

-- Trigger for updated_at
CREATE TRIGGER update_starter_kit_inventory_updated_at
BEFORE UPDATE ON public.starter_kit_inventory
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Function to allocate a starter kit (FIFO from oldest batch)
CREATE OR REPLACE FUNCTION public.allocate_starter_kit(
  p_invoice_item_id UUID,
  p_handler_id UUID,
  p_dog_name TEXT,
  p_branch_id UUID
)
RETURNS TABLE(success BOOLEAN, remaining_total INTEGER, message TEXT)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_batch_id UUID;
  v_remaining INTEGER;
BEGIN
  -- Find oldest batch with remaining stock (FIFO)
  SELECT id, quantity_remaining INTO v_batch_id, v_remaining
  FROM public.starter_kit_inventory
  WHERE quantity_remaining > 0
  ORDER BY purchase_date ASC, created_at ASC
  LIMIT 1
  FOR UPDATE;

  -- If no stock available
  IF v_batch_id IS NULL THEN
    RETURN QUERY SELECT false, 0, 'No starter kits in stock'::TEXT;
    RETURN;
  END IF;

  -- Decrement stock
  UPDATE public.starter_kit_inventory
  SET quantity_remaining = quantity_remaining - 1,
      updated_at = now()
  WHERE id = v_batch_id;

  -- Create allocation record
  INSERT INTO public.starter_kit_allocations (
    inventory_batch_id,
    branch_id,
    invoice_item_id,
    handler_id,
    dog_name
  ) VALUES (
    v_batch_id,
    p_branch_id,
    p_invoice_item_id,
    p_handler_id,
    p_dog_name
  );

  -- Get total remaining across all batches
  SELECT COALESCE(SUM(quantity_remaining), 0) INTO v_remaining
  FROM public.starter_kit_inventory;

  RETURN QUERY SELECT true, v_remaining::INTEGER, 'Starter kit allocated successfully'::TEXT;
END;
$$;

-- Function to get total stock
CREATE OR REPLACE FUNCTION public.get_starter_kit_stock()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_total INTEGER;
BEGIN
  SELECT COALESCE(SUM(quantity_remaining), 0) INTO v_total
  FROM public.starter_kit_inventory;
  RETURN v_total;
END;
$$;