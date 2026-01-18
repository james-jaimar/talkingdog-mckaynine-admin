-- Phase 1: Add branch_id to invoices table for proper branch attribution
-- This allows handlers to have invoices in multiple branches

-- Step 1: Add the branch_id column to invoices
ALTER TABLE public.invoices 
ADD COLUMN branch_id uuid REFERENCES public.branches(id);

-- Step 2: Create index for performance
CREATE INDEX idx_invoices_branch_id ON public.invoices(branch_id);

-- Step 3: Backfill existing invoices with correct branch
-- For invoices with booking-linked items: derive branch from class.branch_id
-- For invoices without bookings: use client.branch_id as fallback

UPDATE public.invoices inv
SET branch_id = COALESCE(
  -- First try to get branch from class (via invoice_items -> bookings -> class_schedules -> classes)
  (
    SELECT DISTINCT cl.branch_id
    FROM public.invoice_items ii
    JOIN public.bookings b ON b.id = ii.booking_id
    JOIN public.class_schedules cs ON cs.id = b.class_schedule_id
    JOIN public.classes cl ON cl.id = cs.class_id
    WHERE ii.invoice_id = inv.id
    AND ii.booking_id IS NOT NULL
    LIMIT 1
  ),
  -- Fallback to client's branch
  (
    SELECT c.branch_id 
    FROM public.clients c 
    WHERE c.id = inv.client_id
  )
)
WHERE inv.branch_id IS NULL;

-- Step 4: Update the booking trigger to ALLOW cross-branch bookings
-- (Handlers can legitimately enroll dogs in classes at different branches)
CREATE OR REPLACE FUNCTION public.ensure_booking_branch_consistency()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_client_branch_id uuid;
  v_class_branch_id uuid;
BEGIN
  -- Fetch client branch
  SELECT c.branch_id
  INTO v_client_branch_id
  FROM public.clients c
  WHERE c.id = NEW.client_id;

  -- Fetch class branch via schedule -> class
  SELECT cl.branch_id
  INTO v_class_branch_id
  FROM public.class_schedules cs
  JOIN public.classes cl ON cl.id = cs.class_id
  WHERE cs.id = NEW.class_schedule_id;

  -- If we can't resolve class branch, let it pass
  IF v_class_branch_id IS NULL THEN
    RETURN NEW;
  END IF;

  -- If client has no branch, set it to the class branch
  IF v_client_branch_id IS NULL THEN
    UPDATE public.clients
    SET branch_id = v_class_branch_id
    WHERE id = NEW.client_id;
  END IF;

  -- ALLOW cross-branch bookings - handlers can enroll in classes at different branches
  -- The invoice will be created with the CLASS's branch_id, not the client's
  -- This keeps financial data properly separated by branch

  RETURN NEW;
END;
$function$;