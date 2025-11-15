-- Add missing add_user_credits RPC function
CREATE OR REPLACE FUNCTION public.add_user_credits(user_id_param uuid, credits_amount integer)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Update user credits balance
  UPDATE public.user_credits
  SET 
    credits_balance = credits_balance + credits_amount,
    total_credits_purchased = total_credits_purchased + credits_amount,
    updated_at = now()
  WHERE user_id = user_id_param;
  
  -- If no row exists, insert one
  IF NOT FOUND THEN
    INSERT INTO public.user_credits (user_id, credits_balance, total_credits_purchased)
    VALUES (user_id_param, credits_amount, credits_amount);
  END IF;
  
  -- Log the transaction
  INSERT INTO public.credit_transactions (user_id, transaction_type, amount, description)
  VALUES (user_id_param, 'purchase', credits_amount, 'Credits purchased');
END;
$$;

-- Add updated_at column to messages table if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'messages' 
    AND column_name = 'updated_at'
  ) THEN
    ALTER TABLE public.messages ADD COLUMN updated_at timestamp with time zone DEFAULT now();
  END IF;
END $$;