
-- Enhance the duplicate trainer payment fix function to handle null booking_ids
CREATE OR REPLACE FUNCTION public.fix_duplicate_trainer_payments()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_duplicate RECORD;
  v_primary_id UUID;
  v_duplicate_ids UUID[];
  v_result JSONB := jsonb_build_object('merged_count', 0);
BEGIN
  -- First, find duplicates based on trainer_id and class_schedule_id
  -- regardless of booking_id (more restrictive constraint)
  FOR v_duplicate IN (
    SELECT 
      trainer_id, 
      class_schedule_id, 
      COUNT(*) as count,
      array_agg(id) as ids
    FROM public.trainer_payments
    GROUP BY trainer_id, class_schedule_id
    HAVING COUNT(*) > 1
  ) LOOP
    -- Get the first ID as primary (preferably the one with non-null booking_id)
    SELECT 
      CASE WHEN EXISTS (
        SELECT 1 FROM public.trainer_payments 
        WHERE trainer_id = v_duplicate.trainer_id 
        AND class_schedule_id = v_duplicate.class_schedule_id
        AND booking_id IS NOT NULL
        LIMIT 1
      )
      THEN (
        SELECT id FROM public.trainer_payments
        WHERE trainer_id = v_duplicate.trainer_id 
        AND class_schedule_id = v_duplicate.class_schedule_id
        AND booking_id IS NOT NULL
        ORDER BY created_at
        LIMIT 1
      )
      ELSE v_duplicate.ids[1]
      END INTO v_primary_id;
      
    -- Get other IDs as duplicates to be removed
    SELECT array_remove(v_duplicate.ids, v_primary_id) INTO v_duplicate_ids;
    
    -- Update the primary record with the most complete data
    UPDATE public.trainer_payments AS tp_primary
    SET
      status = COALESCE(tp_primary.status, 
                        (SELECT status FROM public.trainer_payments 
                         WHERE id = ANY(v_duplicate_ids) AND status IS NOT NULL 
                         LIMIT 1)),
      payment_date = COALESCE(tp_primary.payment_date, 
                             (SELECT payment_date FROM public.trainer_payments 
                              WHERE id = ANY(v_duplicate_ids) AND payment_date IS NOT NULL 
                              LIMIT 1)),
      payment_method = COALESCE(tp_primary.payment_method, 
                               (SELECT payment_method FROM public.trainer_payments 
                                WHERE id = ANY(v_duplicate_ids) AND payment_method IS NOT NULL 
                                LIMIT 1)),
      transaction_id = COALESCE(tp_primary.transaction_id, 
                               (SELECT transaction_id FROM public.trainer_payments 
                                WHERE id = ANY(v_duplicate_ids) AND transaction_id IS NOT NULL 
                                LIMIT 1)),
      notes = COALESCE(tp_primary.notes, 
                      (SELECT notes FROM public.trainer_payments 
                       WHERE id = ANY(v_duplicate_ids) AND notes IS NOT NULL 
                       LIMIT 1)),
      document_url = COALESCE(tp_primary.document_url, 
                             (SELECT document_url FROM public.trainer_payments 
                              WHERE id = ANY(v_duplicate_ids) AND document_url IS NOT NULL 
                              LIMIT 1)),
      document_name = COALESCE(tp_primary.document_name, 
                              (SELECT document_name FROM public.trainer_payments 
                               WHERE id = ANY(v_duplicate_ids) AND document_name IS NOT NULL 
                               LIMIT 1)),
      amount = CASE 
                WHEN tp_primary.amount > 0 THEN tp_primary.amount 
                ELSE COALESCE(
                      (SELECT amount FROM public.trainer_payments 
                       WHERE id = ANY(v_duplicate_ids) AND amount > 0 
                       LIMIT 1), 0)
              END,
      booking_id = COALESCE(tp_primary.booking_id,
                           (SELECT booking_id FROM public.trainer_payments
                            WHERE id = ANY(v_duplicate_ids) AND booking_id IS NOT NULL
                            LIMIT 1)),
      updated_at = now()
    WHERE
      id = v_primary_id;
    
    -- Delete duplicate records, keeping just the primary
    DELETE FROM public.trainer_payments
    WHERE id = ANY(v_duplicate_ids);
    
    -- Increment the merged count in the result
    v_result := jsonb_set(v_result, '{merged_count}', 
                         to_jsonb((v_result->>'merged_count')::int + 1));
  END LOOP;

  -- Also handle any orphaned payments with invalid booking_ids
  -- that no longer link to valid invoice items
  UPDATE public.trainer_payments
  SET booking_id = NULL
  WHERE booking_id IS NOT NULL 
  AND NOT EXISTS (
    SELECT 1 FROM invoice_items 
    WHERE id = trainer_payments.invoice_item_id 
    OR booking_id = trainer_payments.booking_id
  );
  
  RETURN v_result;
END;
$$;

-- Update the trigger function for invoice items to use the correct unique constraint
CREATE OR REPLACE FUNCTION public.create_trainer_payment_for_booking()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_trainer_id UUID;
  v_class_schedule_id UUID;
  v_amount NUMERIC;
BEGIN
  -- Only process invoice items with booking_id
  IF NEW.booking_id IS NULL THEN
    RETURN NEW;
  END IF;
  
  -- Get class schedule and trainer info from booking
  SELECT 
    cs.id, cs.trainer_id
  INTO 
    v_class_schedule_id, v_trainer_id
  FROM 
    bookings b
    JOIN class_schedules cs ON b.class_schedule_id = cs.id
  WHERE 
    b.id = NEW.booking_id;
  
  -- If no trainer or class schedule found, exit
  IF v_trainer_id IS NULL OR v_class_schedule_id IS NULL THEN
    RETURN NEW;
  END IF;
  
  -- Calculate trainer's payment amount
  v_amount := public.calculate_trainer_payment(NEW.booking_id);
  
  -- Insert or update trainer payment record using the trainer_id + class_schedule_id constraint
  -- This fixes the issue with duplicate records when trainer_id + class_schedule_id are the same
  INSERT INTO public.trainer_payments (
    trainer_id, class_schedule_id, booking_id, invoice_item_id, amount, status
  ) VALUES (
    v_trainer_id, v_class_schedule_id, NEW.booking_id, NEW.id, v_amount, 'pending'
  )
  ON CONFLICT ON CONSTRAINT unique_trainer_schedule_payment
  DO UPDATE SET
    invoice_item_id = NEW.id,
    booking_id = NEW.booking_id,
    amount = EXCLUDED.amount,
    updated_at = now();
    
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Log error but don't block invoice item creation
    RAISE WARNING 'Error creating trainer payment: %', SQLERRM;
    RETURN NEW;
END;
$$;

-- Make sure storage bucket is public after running the migration
UPDATE storage.buckets 
SET public = true 
WHERE id = 'payment-documents';

-- Create a cron job to automatically run the fix_duplicate_trainer_payments function daily
-- to catch any issues that might arise
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_extension WHERE extname = 'pg_cron'
  ) THEN
    -- Skip cron setup if the extension isn't enabled
    RAISE NOTICE 'pg_cron extension not available - skipping cron job creation';
    RETURN;
  END IF;

  PERFORM cron.schedule(
    'fix-duplicate-trainer-payments-daily',
    '0 3 * * *',  -- Run at 3 AM every day
    $$SELECT fix_duplicate_trainer_payments();$$
  );
EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE 'Could not create cron job: %', SQLERRM;
END$$;
