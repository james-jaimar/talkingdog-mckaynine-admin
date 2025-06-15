
-- Drop the handler_class_status table if it exists (cleanup, since failed creation may have left artifacts)
drop table if exists public.handler_class_status cascade;

-- Recreate handler_class_status with handler_id as a UUID, but no foreign key constraint
create table public.handler_class_status (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid references bookings(id) on delete cascade,
  class_id uuid references classes(id) on delete cascade,
  handler_id uuid,                 -- handler_id (clients.id), not enforced as foreign key for compatibility
  class_type text,
  completed boolean default false,
  completed_at timestamptz,
  completion_method text,          -- e.g. 'auto', 'manual'
  period text,                     -- e.g. 'Term 2 2025', optional
  created_at timestamptz default now()
);

-- Index for lookup
create index handler_class_status_handler_idx on handler_class_status(handler_id);
create index handler_class_status_class_idx on handler_class_status(class_id);

comment on table public.handler_class_status is 'Tracks handler completion status for each class, populated automatically/sporadically on class close for certificates/comms.';
