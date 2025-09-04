-- Fix security definer function with proper search path
CREATE OR REPLACE FUNCTION generate_unique_profile_code()
RETURNS TEXT 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
    code TEXT;
    exists_check BOOLEAN;
BEGIN
    LOOP
        -- Generate 8-character alphanumeric code (uppercase)
        code := UPPER(
            SUBSTRING(
                encode(gen_random_bytes(6), 'base64')
                FROM 1 FOR 8
            )
        );
        
        -- Remove special characters and ensure only alphanumeric
        code := REGEXP_REPLACE(code, '[^A-Z0-9]', '', 'g');
        
        -- Ensure it's exactly 8 characters
        IF LENGTH(code) >= 8 THEN
            code := SUBSTRING(code FROM 1 FOR 8);
            
            -- Check if code already exists
            SELECT EXISTS(
                SELECT 1 FROM public.profiles 
                WHERE unique_code = code
            ) INTO exists_check;
            
            -- If code doesn't exist, return it
            IF NOT exists_check THEN
                RETURN code;
            END IF;
        END IF;
    END LOOP;
END;
$$;