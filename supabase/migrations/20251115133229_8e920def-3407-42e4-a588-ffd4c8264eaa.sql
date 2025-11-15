-- Drop the old constraint that only allowed 'hourly' and 'fixed'
ALTER TABLE shifts DROP CONSTRAINT IF EXISTS shifts_pay_rate_type_check;

-- Add new constraint with expanded values: hourly, daily, monthly, fixed
ALTER TABLE shifts ADD CONSTRAINT shifts_pay_rate_type_check 
  CHECK (pay_rate_type IN ('hourly', 'daily', 'monthly', 'fixed'));