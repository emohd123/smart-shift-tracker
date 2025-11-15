-- Add manual status override columns to shifts table
ALTER TABLE shifts 
ADD COLUMN IF NOT EXISTS manual_status_override BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS override_status TEXT;

-- Add constraint for override_status
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'shifts_override_status_check'
  ) THEN
    ALTER TABLE shifts
    ADD CONSTRAINT shifts_override_status_check 
    CHECK (override_status IN ('upcoming', 'ongoing', 'completed', 'cancelled') OR override_status IS NULL);
  END IF;
END $$;

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_shift_assignments_shift_id ON shift_assignments(shift_id);
CREATE INDEX IF NOT EXISTS idx_time_logs_shift_id ON time_logs(shift_id);
CREATE INDEX IF NOT EXISTS idx_time_logs_user_id ON time_logs(user_id);

-- Enable realtime for shift_assignments and time_logs
ALTER PUBLICATION supabase_realtime ADD TABLE shift_assignments;
ALTER PUBLICATION supabase_realtime ADD TABLE time_logs;