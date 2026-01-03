-- Add continuation preference columns to handler_class_status
ALTER TABLE handler_class_status 
ADD COLUMN IF NOT EXISTS next_class_type text,
ADD COLUMN IF NOT EXISTS next_term_number text,
ADD COLUMN IF NOT EXISTS next_term_year integer;

-- Add comments for documentation
COMMENT ON COLUMN handler_class_status.next_class_type IS 'The class type handler wants to continue to (e.g., EO, CGC Bronze)';
COMMENT ON COLUMN handler_class_status.next_term_number IS 'The term number for continuation (1, 2, 3, or 4)';
COMMENT ON COLUMN handler_class_status.next_term_year IS 'The year for continuation (e.g., 2025, 2026)';