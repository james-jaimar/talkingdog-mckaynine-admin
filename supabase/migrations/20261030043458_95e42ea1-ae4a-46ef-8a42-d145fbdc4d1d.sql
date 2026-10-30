CREATE TEMP TABLE inventory_code_backfill_before ON COMMIT DROP AS
SELECT ii.id, to_jsonb(ii) - 'io_inventory_code' - 'updated_at' AS item_before, to_jsonb(i) AS invoice_before
FROM public.invoice_items ii JOIN public.invoices i ON i.id=ii.invoice_id
WHERE ii.id IN ('0c7de1ed-f60d-46de-898c-1cfabf4667cf','c6c258af-9fb4-472d-8163-22e7441aee61','a7ea72e3-db77-4d17-b7a3-a92ce0dfe757','12fff5e0-6aeb-4a2e-8e2f-c179bf6f7e69','9e9ea8c0-c73c-4743-9446-aa117b0d80a1','4498fa87-a500-4ca5-acaf-a2cc78a3807d','2167f700-0988-4314-8002-5e24760b244d','e03858bc-be77-4739-8849-32bcc4b360a9','910a228a-66bf-4367-af9c-b9665ba4da91')
AND i.branch_id='6351a9e8-77db-403b-ab1f-cd47e393a006' AND i.franchise_report_month='2026-10';
UPDATE public.invoice_items ii
SET io_inventory_code = CASE WHEN ii.item_type='enrollment_fee' OR lower(ii.description) LIKE '%enrollment fee%' OR lower(ii.description) LIKE '%enrolment fee%' THEN 'EN' ELSE trim(c.io_inventory_code) END
FROM inventory_code_backfill_before snap, public.bookings b, public.class_schedules cs, public.classes c, public.invoices i
WHERE ii.id=snap.id AND b.id=ii.booking_id AND cs.id=b.class_schedule_id AND c.id=cs.class_id AND i.id=ii.invoice_id AND c.branch_id=i.branch_id
AND NULLIF(trim(ii.io_inventory_code),'') IS NULL AND NULLIF(trim(c.io_inventory_code),'') IS NOT NULL;
DO $$ BEGIN
IF (SELECT count(*) FROM inventory_code_backfill_before) <> 9 THEN RAISE EXCEPTION 'Expected nine confirmed items'; END IF;
IF EXISTS (SELECT 1 FROM inventory_code_backfill_before snap JOIN public.invoice_items ii ON ii.id=snap.id JOIN public.invoices i ON i.id=ii.invoice_id WHERE snap.item_before IS DISTINCT FROM (to_jsonb(ii)-'io_inventory_code'-'updated_at') OR snap.invoice_before IS DISTINCT FROM to_jsonb(i) OR NULLIF(trim(ii.io_inventory_code),'') IS NULL) THEN RAISE EXCEPTION 'Backfill changed protected data or left a missing code'; END IF;
END $$;