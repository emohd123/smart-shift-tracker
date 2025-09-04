-- Backfill existing data with default tenant
-- This script safely migrates existing single-tenant data to multi-tenant structure

-- STEP 1: Create default tenant for existing data
DO $$
DECLARE
  default_tenant_id UUID;
  existing_users_count INTEGER;
BEGIN
  -- Check if we have existing users
  SELECT COUNT(*) INTO existing_users_count FROM auth.users;
  
  -- Only create default tenant if we have existing data
  IF existing_users_count > 0 THEN
    -- Create default tenant
    INSERT INTO public.tenants (
      id,
      name, 
      slug, 
      settings,
      subscription_tier,
      subscription_status,
      max_users
    ) VALUES (
      gen_random_uuid(),
      'Default Organization',
      'default-org',
      '{"migration": true, "created_from_existing_data": true}',
      'professional',
      'active',
      1000
    )
    ON CONFLICT (slug) DO UPDATE SET
      name = EXCLUDED.name,
      updated_at = now()
    RETURNING id INTO default_tenant_id;

    -- If no insert happened due to conflict, get existing default tenant
    IF default_tenant_id IS NULL THEN
      SELECT id INTO default_tenant_id FROM public.tenants WHERE slug = 'default-org';
    END IF;

    RAISE NOTICE 'Created/found default tenant with ID: %', default_tenant_id;

    -- STEP 2: Create tenant memberships for existing users
    INSERT INTO public.tenant_memberships (
      tenant_id,
      user_id,
      role,
      status,
      joined_at,
      created_at,
      updated_at
    )
    SELECT 
      default_tenant_id,
      u.id,
      CASE 
        WHEN p.role = 'admin' THEN 'company_admin'
        WHEN p.role = 'company' THEN 'company_manager'  
        ELSE 'part_timer'
      END,
      'active',
      u.created_at,
      u.created_at,
      now()
    FROM auth.users u
    LEFT JOIN public.profiles p ON u.id = p.id
    ON CONFLICT (tenant_id, user_id) DO UPDATE SET
      role = EXCLUDED.role,
      updated_at = now();

    -- STEP 3: Backfill tenant_id in existing tables

    -- Backfill profiles table
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'profiles' AND table_schema = 'public') THEN
      UPDATE public.profiles 
      SET tenant_id = default_tenant_id 
      WHERE tenant_id IS NULL;
      
      -- Make tenant_id NOT NULL after backfill
      ALTER TABLE public.profiles ALTER COLUMN tenant_id SET NOT NULL;
    END IF;

    -- Backfill shifts table  
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'shifts' AND table_schema = 'public') THEN
      UPDATE public.shifts 
      SET tenant_id = default_tenant_id 
      WHERE tenant_id IS NULL;
      
      -- Make tenant_id NOT NULL after backfill
      ALTER TABLE public.shifts ALTER COLUMN tenant_id SET NOT NULL;
    END IF;

    -- Backfill timesheets table
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'timesheets' AND table_schema = 'public') THEN
      UPDATE public.timesheets 
      SET tenant_id = default_tenant_id 
      WHERE tenant_id IS NULL;
      
      -- Make tenant_id NOT NULL after backfill
      ALTER TABLE public.timesheets ALTER COLUMN tenant_id SET NOT NULL;
    END IF;

    -- Backfill companies table
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'companies' AND table_schema = 'public') THEN
      UPDATE public.companies 
      SET tenant_id = default_tenant_id 
      WHERE tenant_id IS NULL;
      
      -- Make tenant_id NOT NULL after backfill
      ALTER TABLE public.companies ALTER COLUMN tenant_id SET NOT NULL;
    END IF;

    -- Backfill certificates table
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'certificates' AND table_schema = 'public') THEN
      UPDATE public.certificates 
      SET tenant_id = default_tenant_id 
      WHERE tenant_id IS NULL;
      
      -- Make tenant_id NOT NULL after backfill
      ALTER TABLE public.certificates ALTER COLUMN tenant_id SET NOT NULL;
    END IF;

    -- STEP 4: Create shift assignments for existing approved shift applications
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'shift_applications' AND table_schema = 'public') THEN
      INSERT INTO public.shift_assignments (
        tenant_id,
        shift_id,
        part_timer_id,
        assigned_by,
        status,
        assigned_at,
        responded_at,
        created_at,
        updated_at
      )
      SELECT DISTINCT
        default_tenant_id,
        sa.shift_id,
        sa.promoter_id,
        COALESCE(sa.reviewed_by, sa.promoter_id), -- Use reviewer or self-assign if no reviewer
        CASE sa.status 
          WHEN 'approved' THEN 'accepted'
          ELSE 'assigned'
        END,
        sa.application_date,
        sa.reviewed_at,
        sa.created_at,
        sa.updated_at
      FROM public.shift_applications sa
      WHERE sa.status IN ('approved', 'pending')
      ON CONFLICT (shift_id, part_timer_id) DO NOTHING;
    END IF;

    -- STEP 5: Log the migration in audit logs
    INSERT INTO public.audit_logs (
      tenant_id,
      user_id,
      action,
      resource_type,
      resource_id,
      new_values,
      ip_address,
      user_agent,
      created_at
    ) VALUES (
      default_tenant_id,
      NULL, -- System action
      'create',
      'tenant',
      default_tenant_id,
      jsonb_build_object(
        'migration', true,
        'users_migrated', existing_users_count,
        'tenant_name', 'Default Organization',
        'migration_date', now()
      ),
      '127.0.0.1',
      'Migration Script',
      now()
    );

    RAISE NOTICE 'Migration completed successfully. Migrated % users to default tenant.', existing_users_count;
  ELSE
    RAISE NOTICE 'No existing users found. Skipping default tenant creation.';
  END IF;
END $$;

-- STEP 6: Create indexes after data backfill for better performance
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_profiles_tenant_role ON public.profiles(tenant_id, role) 
  WHERE tenant_id IS NOT NULL;

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_shifts_tenant_date ON public.shifts(tenant_id, date) 
  WHERE tenant_id IS NOT NULL;

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_timesheets_tenant_approval ON public.timesheets(tenant_id, approval_status, created_at) 
  WHERE tenant_id IS NOT NULL;

-- STEP 7: Update table constraints and add foreign key validation
DO $$
BEGIN
  -- Add check constraint to ensure tenant_id consistency in shift_assignments
  IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints 
                WHERE constraint_name = 'shift_assignments_tenant_consistency' 
                AND table_name = 'shift_assignments') THEN
    ALTER TABLE public.shift_assignments 
    ADD CONSTRAINT shift_assignments_tenant_consistency 
    CHECK (tenant_id = (SELECT tenant_id FROM public.shifts WHERE id = shift_id));
  END IF;
END $$;

-- STEP 8: Refresh statistics for query planner
ANALYZE public.tenants;
ANALYZE public.tenant_memberships;
ANALYZE public.shift_assignments;
ANALYZE public.profiles;
ANALYZE public.shifts;
ANALYZE public.timesheets;
ANALYZE public.companies;
ANALYZE public.certificates;
ANALYZE public.audit_logs;

-- Success message
DO $$
BEGIN
    RAISE NOTICE 'Data backfill completed successfully. All existing records now have tenant associations.';
END $$;