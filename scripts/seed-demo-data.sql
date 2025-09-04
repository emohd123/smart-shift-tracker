-- Demo Data Seed Script for Multi-Tenant SaaS
-- This script creates sample tenants, users, and data for development/testing

-- Create demo tenants
INSERT INTO public.tenants (id, name, slug, settings, subscription_tier, subscription_status, max_users) VALUES 
  ('550e8400-e29b-41d4-a716-446655440001', 'Acme Corporation', 'acme-corp', '{"demo": true}', 'professional', 'active', 100),
  ('550e8400-e29b-41d4-a716-446655440002', 'Beta Solutions', 'beta-solutions', '{"demo": true}', 'starter', 'active', 25),
  ('550e8400-e29b-41d4-a716-446655440003', 'Gamma Enterprises', 'gamma-enterprises', '{"demo": true}', 'enterprise', 'active', 500)
ON CONFLICT (slug) DO UPDATE SET 
  name = EXCLUDED.name,
  updated_at = now();

-- Note: In a real setup, users would be created through Supabase Auth
-- This is just for demo purposes to show the data structure

-- Create sample shifts for Acme Corporation
INSERT INTO public.shifts (
  id, tenant_id, title, description, date, location, assigned_count, hourly_rate, created_at, updated_at
) VALUES 
  (gen_random_uuid(), '550e8400-e29b-41d4-a716-446655440001', 'Product Launch Event', 'Promotional event for new product line', '2024-10-15', 'Downtown Convention Center', 0, 25.00, now(), now()),
  (gen_random_uuid(), '550e8400-e29b-41d4-a716-446655440001', 'Trade Show Booth', 'Staff trade show booth and engage with customers', '2024-10-20', 'City Exhibition Hall', 0, 22.50, now(), now()),
  (gen_random_uuid(), '550e8400-e29b-41d4-a716-446655440001', 'Grand Opening Support', 'Help with grand opening of new store location', '2024-10-25', 'Westside Shopping Mall', 0, 20.00, now(), now())
ON CONFLICT (id) DO NOTHING;

-- Create sample shifts for Beta Solutions  
INSERT INTO public.shifts (
  id, tenant_id, title, description, date, location, assigned_count, hourly_rate, created_at, updated_at
) VALUES 
  (gen_random_uuid(), '550e8400-e29b-41d4-a716-446655440002', 'Software Demo Day', 'Demonstrate software solutions to potential clients', '2024-10-18', 'Tech Hub Building A', 0, 30.00, now(), now()),
  (gen_random_uuid(), '550e8400-e29b-41d4-a716-446655440002', 'Conference Networking', 'Network and promote services at tech conference', '2024-10-22', 'Grand Hotel Conference Center', 0, 28.00, now(), now())
ON CONFLICT (id) DO NOTHING;

-- Create sample shifts for Gamma Enterprises
INSERT INTO public.shifts (
  id, tenant_id, title, description, date, location, assigned_count, hourly_rate, created_at, updated_at
) VALUES 
  (gen_random_uuid(), '550e8400-e29b-41d4-a716-446655440003', 'Warehouse Event Setup', 'Set up warehouse for corporate event', '2024-10-16', 'Industrial District Warehouse 5', 0, 18.00, now(), now()),
  (gen_random_uuid(), '550e8400-e29b-41d4-a716-446655440003', 'Client Appreciation Dinner', 'Serve and support client appreciation dinner', '2024-10-19', 'Riverside Country Club', 0, 24.00, now(), now()),
  (gen_random_uuid(), '550e8400-e29b-41d4-a716-446655440003', 'Team Building Event', 'Facilitate and support team building activities', '2024-10-26', 'Adventure Park Resort', 0, 21.00, now(), now())
ON CONFLICT (id) DO NOTHING;

-- Create sample companies for each tenant
INSERT INTO public.companies (
  user_id, tenant_id, name, website, registration_id, address, created_at, updated_at
) VALUES 
  -- Note: user_id would normally be real auth.users IDs
  -- For demo purposes, we'll use placeholder UUIDs
  ('00000000-0000-0000-0000-000000000001', '550e8400-e29b-41d4-a716-446655440001', 'Acme Corporation', 'https://acme-corp.com', 'AC-12345', '123 Business Ave, City, State 12345', now(), now()),
  ('00000000-0000-0000-0000-000000000002', '550e8400-e29b-41d4-a716-446655440002', 'Beta Solutions Inc.', 'https://betasolutions.com', 'BS-67890', '456 Tech Street, City, State 12345', now(), now()),
  ('00000000-0000-0000-0000-000000000003', '550e8400-e29b-41d4-a716-446655440003', 'Gamma Enterprises LLC', 'https://gamma-ent.com', 'GE-11111', '789 Corporate Blvd, City, State 12345', now(), now())
ON CONFLICT (user_id) DO UPDATE SET 
  name = EXCLUDED.name,
  updated_at = now();

-- Log the seed operation
INSERT INTO public.audit_logs (
  tenant_id,
  user_id,
  action,
  resource_type,
  new_values,
  ip_address,
  user_agent,
  created_at
) VALUES (
  NULL, -- System operation
  NULL,
  'create',
  'tenant',
  jsonb_build_object(
    'demo_seed', true,
    'tenants_created', 3,
    'shifts_created', 8,
    'companies_created', 3,
    'seed_date', now()
  ),
  '127.0.0.1',
  'Demo Data Seed Script',
  now()
);

-- Success message
DO $$
BEGIN
    RAISE NOTICE 'Demo data seeded successfully:';
    RAISE NOTICE '- 3 demo tenants created (acme-corp, beta-solutions, gamma-enterprises)';
    RAISE NOTICE '- 8 sample shifts created across all tenants'; 
    RAISE NOTICE '- 3 sample companies created';
    RAISE NOTICE '- Ready for multi-tenant development and testing';
END $$;