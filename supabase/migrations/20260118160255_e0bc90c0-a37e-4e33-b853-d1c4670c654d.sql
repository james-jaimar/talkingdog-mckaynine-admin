-- Prevent cross-branch financial data by enforcing that a booking's client branch matches the class branch
-- If the client has no branch yet, auto-assign it from the class branch.

CREATE OR REPLACE FUNCTION public.ensure_booking_branch_consistency()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
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

  -- If we can't resolve either side, let it pass (keeps compatibility during partial data)
  IF v_class_branch_id IS NULL THEN
    RETURN NEW;
  END IF;

  -- If client has no branch, set it to the class branch (prevents future mismatches)
  IF v_client_branch_id IS NULL THEN
    UPDATE public.clients
    SET branch_id = v_class_branch_id
    WHERE id = NEW.client_id;

    RETURN NEW;
  END IF;

  -- If mismatch, block the write
  IF v_client_branch_id <> v_class_branch_id THEN
    RAISE EXCEPTION 'Booking branch mismatch: client.branch_id (%) != class.branch_id (%) for booking %', v_client_branch_id, v_class_branch_id, NEW.id;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_ensure_booking_branch_consistency ON public.bookings;

CREATE TRIGGER trg_ensure_booking_branch_consistency
BEFORE INSERT OR UPDATE OF client_id, class_schedule_id
ON public.bookings
FOR EACH ROW
EXECUTE FUNCTION public.ensure_booking_branch_consistency();
