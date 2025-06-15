
-- 1. Add a 'status' column to classes
ALTER TABLE classes
ADD COLUMN status TEXT NOT NULL DEFAULT 'open'; -- possible values: 'open', 'closed'

-- 2. Extend handler_class_status for auto/manual marking
ALTER TABLE handler_class_status
ADD COLUMN completion_status TEXT NOT NULL DEFAULT 'none', -- 'none', 'auto', 'manual'
ADD COLUMN completion_date TIMESTAMP WITH TIME ZONE;

-- 3. (Optional, for grouping/admin comms) Add class_group table
CREATE TABLE IF NOT EXISTS class_groups (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    class_id UUID NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
    group_name TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Link handlers to class_group (optional/future)
CREATE TABLE IF NOT EXISTS class_group_memberships (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    group_id UUID NOT NULL REFERENCES class_groups(id) ON DELETE CASCADE,
    handler_id UUID NOT NULL REFERENCES clients(id),
    added_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes for faster lookup on handler_class_status, classes
CREATE INDEX IF NOT EXISTS idx_handler_class_status_client ON handler_class_status(client_id, class_type);
CREATE INDEX IF NOT EXISTS idx_classes_status ON classes(status);
