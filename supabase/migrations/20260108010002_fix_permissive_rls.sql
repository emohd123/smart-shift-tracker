-- Migration: Fix overly permissive RLS policies
-- The following policies allow unrestricted access which bypasses row-level security

-- =============================================
-- 1. FIX CREDIT_TRANSACTIONS RLS POLICIES
-- =============================================
-- Current issue: "System can insert transactions" allows anyone to insert (WITH CHECK: true)

-- Drop the permissive policy
DROP POLICY IF EXISTS "System can insert transactions" ON public.credit_transactions;

-- Create more restrictive policy - users can only create transactions for themselves
-- For system-level transactions (like bonuses), use a service role or SECURITY DEFINER function
CREATE POLICY "Users can insert own transactions"
  ON public.credit_transactions
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

-- Add a policy for admins to insert transactions for any user
CREATE POLICY "Admins can insert any transactions"
  ON public.credit_transactions
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
      AND role IN ('admin', 'super_admin')
    )
  );

-- Ensure users can only view their own transactions (already exists but verify)
DROP POLICY IF EXISTS "Users can view their own transactions" ON public.credit_transactions;
CREATE POLICY "Users can view their own transactions"
  ON public.credit_transactions
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- Add policy for admins to view all transactions
CREATE POLICY "Admins can view all transactions"
  ON public.credit_transactions
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
      AND role IN ('admin', 'super_admin')
    )
  );

COMMENT ON POLICY "Users can insert own transactions" ON public.credit_transactions IS 'Users can only create transactions for themselves';
COMMENT ON POLICY "Admins can insert any transactions" ON public.credit_transactions IS 'Admins can create transactions for any user';

-- =============================================
-- 2. FIX SUBSCRIBERS RLS POLICIES
-- =============================================
-- Current issues:
-- - "insert_subscription" allows anyone to insert (WITH CHECK: true)
-- - "update_own_subscription" allows anyone to update (USING: true)

-- Drop the permissive policies
DROP POLICY IF EXISTS "insert_subscription" ON public.subscribers;
DROP POLICY IF EXISTS "update_own_subscription" ON public.subscribers;

-- Create more restrictive insert policy
-- Users can only subscribe themselves (must match their user_id or email)
CREATE POLICY "Users can insert own subscription"
  ON public.subscribers
  FOR INSERT
  TO authenticated
  WITH CHECK (
    -- Either user_id matches or it's being set to NULL for email-only subscriptions
    (user_id IS NULL OR user_id = auth.uid())
    AND
    -- Email must match the authenticated user's email if provided
    (email IS NULL OR email = auth.email())
  );

-- Allow anonymous subscription by email only (for newsletter signups)
CREATE POLICY "Anyone can subscribe with email"
  ON public.subscribers
  FOR INSERT
  TO anon
  WITH CHECK (
    user_id IS NULL  -- Anonymous users can't set user_id
    AND email IS NOT NULL  -- But must provide email
  );

-- Create more restrictive update policy
-- Users can only update their own subscription
CREATE POLICY "Users can update own subscription"
  ON public.subscribers
  FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid() OR email = auth.email())
  WITH CHECK (
    -- Can't change ownership to someone else
    (user_id IS NULL OR user_id = auth.uid())
    AND
    (email IS NULL OR email = auth.email())
  );

-- Ensure select policy exists and is correct (already exists, verify it's correct)
DROP POLICY IF EXISTS "select_own_subscription" ON public.subscribers;
CREATE POLICY "Users can view own subscription"
  ON public.subscribers
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid() OR email = auth.email());

-- Add admin policy to manage all subscriptions
CREATE POLICY "Admins can manage all subscriptions"
  ON public.subscribers
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
      AND role IN ('admin', 'super_admin')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
      AND role IN ('admin', 'super_admin')
    )
  );

-- Add delete policy for users
CREATE POLICY "Users can delete own subscription"
  ON public.subscribers
  FOR DELETE
  TO authenticated
  USING (user_id = auth.uid() OR email = auth.email());

COMMENT ON POLICY "Users can insert own subscription" ON public.subscribers IS 'Users can only create subscriptions for themselves';
COMMENT ON POLICY "Anyone can subscribe with email" ON public.subscribers IS 'Anonymous newsletter signups with email only';
COMMENT ON POLICY "Users can update own subscription" ON public.subscribers IS 'Users can only update their own subscription';
COMMENT ON POLICY "Users can view own subscription" ON public.subscribers IS 'Users can only view their own subscription';
COMMENT ON POLICY "Admins can manage all subscriptions" ON public.subscribers IS 'Admins have full access to all subscriptions';

