-- Add timing and auto check-in/out columns to shift_assignments
ALTER TABLE shift_assignments 
ADD COLUMN scheduled_start_time TIME,
ADD COLUMN scheduled_end_time TIME,
ADD COLUMN auto_checkin_enabled BOOLEAN DEFAULT false,
ADD COLUMN auto_checkout_enabled BOOLEAN DEFAULT false;