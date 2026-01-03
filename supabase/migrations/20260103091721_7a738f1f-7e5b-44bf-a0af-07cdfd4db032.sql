-- 1. Extend handler_class_status table with richer data columns
ALTER TABLE handler_class_status 
ADD COLUMN IF NOT EXISTS pass_percentage numeric,
ADD COLUMN IF NOT EXISTS result_status text DEFAULT 'completed',
ADD COLUMN IF NOT EXISTS result_notes text,
ADD COLUMN IF NOT EXISTS next_action text DEFAULT 'none',
ADD COLUMN IF NOT EXISTS action_completed boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS action_completed_at timestamptz,
ADD COLUMN IF NOT EXISTS action_notes text,
ADD COLUMN IF NOT EXISTS current_time_slot text,
ADD COLUMN IF NOT EXISTS is_currently_enrolled boolean DEFAULT false;

-- Add comment for result_status options
COMMENT ON COLUMN handler_class_status.result_status IS 'passed | no_pass | incomplete | did_not_grade | did_not_attend | completed';
COMMENT ON COLUMN handler_class_status.next_action IS 'none | continuing | wants_info | stopping';

-- 2. Create handler_tasks table for follow-up actions
CREATE TABLE IF NOT EXISTS handler_tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  handler_id uuid REFERENCES clients(id) ON DELETE CASCADE,
  class_status_id uuid REFERENCES handler_class_status(id) ON DELETE SET NULL,
  class_type text,
  task_type text NOT NULL,
  title text NOT NULL,
  description text,
  status text DEFAULT 'pending',
  due_date date,
  assigned_to uuid,
  completed_at timestamptz,
  completed_by uuid,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Add comments for task fields
COMMENT ON COLUMN handler_tasks.task_type IS 'send_info_pack | follow_up | payment_reminder | enrollment | custom';
COMMENT ON COLUMN handler_tasks.status IS 'pending | in_progress | completed | cancelled';

-- 3. Enable RLS on handler_tasks
ALTER TABLE handler_tasks ENABLE ROW LEVEL SECURITY;

-- 4. Create RLS policies for handler_tasks
CREATE POLICY "Staff can manage handler tasks" 
ON handler_tasks 
FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid() 
    AND (profiles.role = 'admin' OR profiles.role = 'trainer' OR profiles.role = 'platform_admin')
  )
);

-- 5. Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_handler_class_status_next_action ON handler_class_status(next_action);
CREATE INDEX IF NOT EXISTS idx_handler_class_status_result_status ON handler_class_status(result_status);
CREATE INDEX IF NOT EXISTS idx_handler_class_status_is_enrolled ON handler_class_status(is_currently_enrolled);
CREATE INDEX IF NOT EXISTS idx_handler_tasks_status ON handler_tasks(status);
CREATE INDEX IF NOT EXISTS idx_handler_tasks_handler_id ON handler_tasks(handler_id);
CREATE INDEX IF NOT EXISTS idx_handler_tasks_task_type ON handler_tasks(task_type);

-- 6. Create trigger for updated_at on handler_tasks
CREATE TRIGGER update_handler_tasks_updated_at
BEFORE UPDATE ON handler_tasks
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();