
-- Function to make a storage bucket public
CREATE OR REPLACE FUNCTION public.make_bucket_public(bucket_id TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE storage.buckets
  SET public = true
  WHERE id = bucket_id;
  
  RETURN FOUND;
END;
$$;

-- Find and handle duplicate trainer payments
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
  -- Find duplicates based on trainer_id and class_schedule_id
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
    -- Get the first ID as primary
    v_primary_id := v_duplicate.ids[1];
    -- Get other IDs as duplicates to be removed
    SELECT array_remove(v_duplicate.ids, v_primary_id) INTO v_duplicate_ids;
    
    -- Update the primary record with the most complete data
    -- (choose non-null values from duplicates when primary has nulls)
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
  
  RETURN v_result;
END;
$$;
