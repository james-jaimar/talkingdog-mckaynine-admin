-- Backfill assigned_dates for Randburg Puppy bookings.
-- For each booking, take the next 6 dates from the schedule that fall on/after the booking's created_at.
WITH puppy_bookings AS (
  SELECT b.id AS booking_id,
         b.created_at::date AS start_from,
         cs.selected_dates
  FROM public.bookings b
  JOIN public.class_schedules cs ON cs.id = b.class_schedule_id
  JOIN public.classes c ON c.id = cs.class_id
  JOIN public.branches br ON br.id = c.branch_id
  WHERE LOWER(br.name) LIKE '%randburg%'
    AND LOWER(c.class_type) = 'puppy'
    AND b.assigned_dates IS NULL
),
windows AS (
  SELECT pb.booking_id,
         ARRAY(
           SELECT d FROM unnest(pb.selected_dates) AS d
           WHERE d::date >= pb.start_from
           ORDER BY d
           LIMIT 6
         ) AS picked
  FROM puppy_bookings pb
)
UPDATE public.bookings b
SET assigned_dates = w.picked
FROM windows w
WHERE b.id = w.booking_id
  AND array_length(w.picked, 1) > 0;