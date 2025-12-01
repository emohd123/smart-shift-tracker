-- Make pay_rate column nullable to allow shifts without pay rate
ALTER TABLE shifts ALTER COLUMN pay_rate DROP NOT NULL;