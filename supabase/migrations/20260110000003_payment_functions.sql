-- Migration: Create payment-related database functions
-- Date: 2026-01-10
-- Purpose: Functions for receipt number generation, IBAN validation, and payment calculations

-- Function: Generate unique receipt number
-- Format: REC-YYYYMMDD-XXXXXX (6 random digits)
CREATE OR REPLACE FUNCTION public.generate_receipt_number()
RETURNS text
LANGUAGE plpgsql
AS $$
DECLARE
  receipt_num text;
  exists_check boolean;
  retry_count integer := 0;
  max_retries integer := 10;
BEGIN
  LOOP
    -- Format: REC-YYYYMMDD-XXXXXX
    receipt_num := 'REC-' || to_char(now(), 'YYYYMMDD') || '-' || 
                   lpad(floor(random() * 1000000)::text, 6, '0');
    
    -- Check if exists
    SELECT EXISTS(SELECT 1 FROM public.payment_receipts WHERE receipt_number = receipt_num) INTO exists_check;
    
    EXIT WHEN NOT exists_check;
    
    -- Prevent infinite loop
    retry_count := retry_count + 1;
    IF retry_count >= max_retries THEN
      RAISE EXCEPTION 'Failed to generate unique receipt number after % attempts', max_retries;
    END IF;
  END LOOP;
  
  RETURN receipt_num;
END;
$$;

-- Function: Validate IBAN format
CREATE OR REPLACE FUNCTION public.validate_iban(iban_text text)
RETURNS boolean
LANGUAGE plpgsql
IMMUTABLE
AS $$
DECLARE
  cleaned_iban text;
BEGIN
  -- Return true for NULL (optional field)
  IF iban_text IS NULL THEN
    RETURN true;
  END IF;
  
  -- Remove spaces and convert to uppercase
  cleaned_iban := upper(replace(iban_text, ' ', ''));
  
  -- Check length (IBAN is 15-34 characters)
  IF length(cleaned_iban) < 15 OR length(cleaned_iban) > 34 THEN
    RETURN false;
  END IF;
  
  -- Check format: 2 letters (country code), 2 digits (check digits), then alphanumeric
  IF NOT (cleaned_iban ~ '^[A-Z]{2}[0-9]{2}[A-Z0-9]+$') THEN
    RETURN false;
  END IF;
  
  RETURN true;
END;
$$;

-- Function: Get payment amount for assignment from time logs
CREATE OR REPLACE FUNCTION public.get_payment_amount_for_assignment(p_assignment_id uuid)
RETURNS numeric
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_shift_id uuid;
  v_pay_rate numeric;
  v_pay_rate_type text;
  v_total_hours numeric := 0;
  v_amount numeric := 0;
BEGIN
  -- Get shift details
  SELECT s.id, s.pay_rate, s.pay_rate_type
  INTO v_shift_id, v_pay_rate, v_pay_rate_type
  FROM public.shift_assignments sa
  JOIN public.shifts s ON s.id = sa.shift_id
  WHERE sa.id = p_assignment_id;
  
  -- If assignment or shift not found, return 0
  IF v_shift_id IS NULL THEN
    RETURN 0;
  END IF;
  
  -- Calculate total hours from time logs
  SELECT COALESCE(SUM(total_hours), 0)
  INTO v_total_hours
  FROM public.time_logs
  WHERE shift_id = v_shift_id
    AND user_id = (SELECT promoter_id FROM public.shift_assignments WHERE id = p_assignment_id)
    AND check_out_time IS NOT NULL; -- Only count completed time logs
  
  -- Calculate amount based on pay rate type
  IF v_pay_rate IS NULL OR v_pay_rate <= 0 THEN
    RETURN 0;
  END IF;
  
  CASE v_pay_rate_type
    WHEN 'hourly' THEN
      v_amount := v_total_hours * v_pay_rate;
    WHEN 'daily' THEN
      -- Assuming 8-hour workday
      v_amount := (v_total_hours / 8.0) * v_pay_rate;
    WHEN 'monthly' THEN
      -- Assuming 160-hour month (4 weeks × 40 hours)
      v_amount := (v_total_hours / 160.0) * v_pay_rate;
    WHEN 'fixed' THEN
      v_amount := v_pay_rate;
    ELSE
      -- Default to hourly
      v_amount := v_total_hours * v_pay_rate;
  END CASE;
  
  RETURN GREATEST(0, v_amount); -- Ensure non-negative
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION public.generate_receipt_number() TO authenticated;
GRANT EXECUTE ON FUNCTION public.validate_iban(text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_payment_amount_for_assignment(uuid) TO authenticated;

-- Comments
COMMENT ON FUNCTION public.generate_receipt_number() IS 'Generates a unique receipt number in format REC-YYYYMMDD-XXXXXX. Retries up to 10 times if collision occurs.';
COMMENT ON FUNCTION public.validate_iban(text) IS 'Validates IBAN format: 15-34 characters, starts with 2 letters (country code), then 2 digits (check digits), then alphanumeric. Returns true for NULL values.';
COMMENT ON FUNCTION public.get_payment_amount_for_assignment(uuid) IS 'Calculates payment amount for an assignment based on time logs and shift pay rate. Returns 0 if no time logs or assignment not found.';
