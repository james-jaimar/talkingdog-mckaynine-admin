ALTER TABLE public.bookings 
ADD COLUMN assigned_dates timestamptz[] DEFAULT NULL;

COMMENT ON COLUMN public.bookings.assigned_dates IS 'Per-handler assigned session dates. Used for roll-on/roll-off classes (e.g., Randburg Puppy) where each handler is committed to a specific window of sessions (typically 6) rather than all schedule dates. NULL for normal classes.';