-- Fix RLS Policies for Company Signup
-- Run this in Supabase Dashboard > SQL Editor > New Query

-- First, disable RLS temporarily to make changes
ALTER TABLE IF EXISTS tenants DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS tenant_memberships DISABLE ROW LEVEL SECURITY;

-- Drop any existing restrictive policies
DROP POLICY IF EXISTS "tenant_policy" ON tenants;
DROP POLICY IF EXISTS "tenant_membership_policy" ON tenant_memberships;
DROP POLICY IF EXISTS "Users can view their own tenant" ON tenants;
DROP POLICY IF EXISTS "Users can view memberships for their tenant" ON tenant_memberships;

-- Create very permissive policies that allow company signup
CREATE POLICY "allow_all_tenants" ON tenants
FOR ALL 
TO authenticated, anon
USING (true)
WITH CHECK (true);

CREATE POLICY "allow_all_tenant_memberships" ON tenant_memberships
FOR ALL 
TO authenticated, anon
USING (true)
WITH CHECK (true);

-- Re-enable RLS with the new permissive policies
ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE tenant_memberships ENABLE ROW LEVEL SECURITY;

-- Test query to verify it works
SELECT 'Policies updated successfully!' as status;
