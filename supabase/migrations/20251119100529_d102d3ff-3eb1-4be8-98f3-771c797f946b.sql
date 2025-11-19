-- Add indexes for time_logs table to optimize history queries
-- These indexes will dramatically speed up queries for work history features

-- Index for user's time logs (for promoter history page)
CREATE INDEX IF NOT EXISTS idx_time_logs_user_id ON time_logs(user_id);

-- Index for shift time logs (for shift detail page)
CREATE INDEX IF NOT EXISTS idx_time_logs_shift_id ON time_logs(shift_id);

-- Composite index for user + shift queries
CREATE INDEX IF NOT EXISTS idx_time_logs_user_shift ON time_logs(user_id, shift_id);

-- Index for date-based queries (for filtering by date range)
CREATE INDEX IF NOT EXISTS idx_time_logs_check_in_time ON time_logs(check_in_time DESC);

-- Index for completed logs (check_out_time is not null)
CREATE INDEX IF NOT EXISTS idx_time_logs_check_out_time ON time_logs(check_out_time) WHERE check_out_time IS NOT NULL;

-- Composite index for shift + check-in time (for shift history timeline)
CREATE INDEX IF NOT EXISTS idx_time_logs_shift_checkin ON time_logs(shift_id, check_in_time DESC);