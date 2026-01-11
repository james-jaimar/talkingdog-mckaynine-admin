-- Create RPC to fetch invoices with their items + booking details in a single roundtrip
-- This avoids huge client-side batching / IN(...) URLs and eliminates N+1 requests.

CREATE OR REPLACE FUNCTION public.get_invoices_with_items(p_branch_id uuid)
RETURNS TABLE(
  invoice_id uuid,
  invoice jsonb,
  client jsonb,
  items jsonb
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Only admins can call this.
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'not authorized';
  END IF;

  RETURN QUERY
  SELECT
    i.id AS invoice_id,
    to_jsonb(i.*) AS invoice,
    to_jsonb(c.*) AS client,
    COALESCE(
      jsonb_agg(
        jsonb_build_object(
          'id', ii.id,
          'invoice_id', ii.invoice_id,
          'booking_id', ii.booking_id,
          'description', ii.description,
          'quantity', ii.quantity,
          'unit_price', ii.unit_price,
          'amount', ii.amount,
          'item_type', ii.item_type,
          'bookings', CASE
            WHEN b.id IS NULL THEN NULL
            ELSE jsonb_build_object(
              'id', b.id,
              'dogs', CASE WHEN d.id IS NULL THEN NULL ELSE jsonb_build_object('name', d.name, 'breed', d.breed) END,
              'class_schedules', CASE
                WHEN cs.id IS NULL THEN NULL
                ELSE jsonb_build_object(
                  'id', cs.id,
                  'start_time', cs.start_time,
                  'class_id', cs.class_id,
                  'classes', CASE
                    WHEN cl.id IS NULL THEN NULL
                    ELSE jsonb_build_object('id', cl.id, 'name', cl.name, 'description', cl.description, 'price', cl.course_fee)
                  END
                )
              END
            )
          END
        )
        ORDER BY ii.created_at ASC
      ) FILTER (WHERE ii.id IS NOT NULL),
      '[]'::jsonb
    ) AS items
  FROM public.invoices i
  JOIN public.clients c ON c.id = i.client_id
  LEFT JOIN public.invoice_items ii ON ii.invoice_id = i.id
  LEFT JOIN public.bookings b ON b.id = ii.booking_id
  LEFT JOIN public.dogs d ON d.id = b.dog_id
  LEFT JOIN public.class_schedules cs ON cs.id = b.class_schedule_id
  LEFT JOIN public.classes cl ON cl.id = cs.class_id
  WHERE c.branch_id = p_branch_id
  GROUP BY i.id, c.id
  ORDER BY i.created_at DESC;
END;
$$;

REVOKE ALL ON FUNCTION public.get_invoices_with_items(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_invoices_with_items(uuid) TO authenticated;
