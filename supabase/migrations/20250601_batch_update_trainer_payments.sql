
-- Create a function to batch update trainer payments
CREATE OR REPLACE FUNCTION public.batch_update_trainer_payments(
  p_trainer_id UUID,
  p_existing_ids UUID[],
  p_missing_schedules UUID[],
  p_update_data JSONB
) RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_updated_count INTEGER := 0;
  v_created_count INTEGER := 0;
  v_record RECORD;
  v_now TIMESTAMP WITH TIME ZONE := now();
  v_payment_date TIMESTAMP WITH TIME ZONE;
  v_payment_method TEXT;
  v_transaction_id TEXT;
  v_notes TEXT;
  v_document_url TEXT;
  v_document_name TEXT;
  v_amount NUMERIC;
  v_status TEXT := 'paid';
BEGIN
  -- Extract values from JSONB
  v_payment_date := COALESCE((p_update_data->>'payment_date')::TIMESTAMP WITH TIME ZONE, v_now);
  v_payment_method := p_update_data->>'payment_method';
  v_transaction_id := p_update_data->>'transaction_id';
  v_notes := p_update_data->>'notes';
  v_document_url := p_update_data->>'document_url';
  v_document_name := p_update_data->>'document_name';
  v_amount := (p_update_data->>'amount')::NUMERIC;
  
  -- 1. Update existing records
  IF array_length(p_existing_ids, 1) > 0 THEN
    UPDATE public.trainer_payments
    SET 
      status = v_status,
      payment_date = v_payment_date,
      payment_method = v_payment_method,
      transaction_id = v_transaction_id,
      notes = v_notes,
      updated_at = v_now,
      document_url = COALESCE(v_document_url, document_url),
      document_name = COALESCE(v_document_name, document_name),
      amount = CASE WHEN v_amount > 0 THEN v_amount ELSE amount END
    WHERE 
      id = ANY(p_existing_ids);
      
    GET DIAGNOSTICS v_updated_count = ROW_COUNT;
  END IF;
  
  -- 2. Create new records for missing schedule IDs
  IF array_length(p_missing_schedules, 1) > 0 THEN
    FOREACH v_record IN ARRAY (
      SELECT ROW(uuid_generate_v4(), s)::RECORD 
      FROM unnest(p_missing_schedules) s
    )
    LOOP
      INSERT INTO public.trainer_payments (
        id,
        trainer_id,
        class_schedule_id,
        status,
        payment_date,
        payment_method,
        transaction_id,
        notes,
        document_url,
        document_name,
        amount,
        created_at,
        updated_at
      ) VALUES (
        v_record.column1,
        p_trainer_id,
        v_record.column2,
        v_status,
        v_payment_date,
        v_payment_method,
        v_transaction_id,
        v_notes,
        v_document_url,
        v_document_name,
        COALESCE(v_amount, 0),
        v_now,
        v_now
      );
      
      v_created_count := v_created_count + 1;
    END LOOP;
  END IF;
  
  -- Return results
  RETURN jsonb_build_object(
    'updatedCount', v_updated_count,
    'createdCount', v_created_count
  );
END;
$$;

-- Create a unique constraint to prevent duplicate trainer payments
-- for the same trainer and class schedule
ALTER TABLE public.trainer_payments 
DROP CONSTRAINT IF EXISTS unique_trainer_schedule_payment;

ALTER TABLE public.trainer_payments 
ADD CONSTRAINT unique_trainer_schedule_payment 
UNIQUE (trainer_id, class_schedule_id);

-- Make sure storage bucket is public
UPDATE storage.buckets 
SET public = true 
WHERE id = 'payment-documents';
