-- ENHANCED DATABASE SCHEMA WITH COMPREHENSIVE POLICIES
-- This script enhances your existing database with better data persistence, 
-- improved policies, and comprehensive backend functionality

-- ============================================================
-- STEP 1: CREATE MISSING TABLES FOR COMPREHENSIVE FUNCTIONALITY
-- ============================================================

-- User activity tracking table
CREATE TABLE IF NOT EXISTS public.user_activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  activity_type TEXT NOT NULL CHECK (activity_type IN ('login', 'logout', 'shift_created', 'shift_updated', 'shift_deleted', 'time_logged', 'certificate_generated')),
  activity_data JSONB DEFAULT '{}',
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT user_activities_tenant_check CHECK (
    tenant_id IS NULL OR 
    tenant_id IN (SELECT tenant_id FROM public.tenant_memberships WHERE user_id = auth.uid())
  )
);

-- Notifications table
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('info', 'warning', 'error', 'success')),
  read BOOLEAN NOT NULL DEFAULT false,
  action_url TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  read_at TIMESTAMPTZ
);

-- Settings table for user preferences
CREATE TABLE IF NOT EXISTS public.user_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  preferences JSONB NOT NULL DEFAULT '{
    "notifications": {
      "email": true,
      "push": true,
      "shift_reminders": true
    },
    "dashboard": {
      "theme": "light",
      "layout": "grid"
    },
    "privacy": {
      "show_location": true,
      "show_activity": false
    }
  }',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Data backup/sync table
CREATE TABLE IF NOT EXISTS public.data_sync (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  sync_type TEXT NOT NULL CHECK (sync_type IN ('backup', 'restore', 'export')),
  table_name TEXT NOT NULL,
  record_id UUID,
  data_snapshot JSONB NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('pending', 'completed', 'failed')) DEFAULT 'pending',
  error_message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at TIMESTAMPTZ
);

-- ============================================================
-- STEP 2: ADD INDEXES FOR PERFORMANCE
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_user_activities_tenant_user ON public.user_activities(tenant_id, user_id);
CREATE INDEX IF NOT EXISTS idx_user_activities_type_created ON public.user_activities(activity_type, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_user_read ON public.notifications(user_id, read);
CREATE INDEX IF NOT EXISTS idx_notifications_tenant_created ON public.notifications(tenant_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_user_settings_user ON public.user_settings(user_id);
CREATE INDEX IF NOT EXISTS idx_data_sync_tenant_status ON public.data_sync(tenant_id, status);

-- ============================================================
-- STEP 3: ENHANCED TRIGGERS FOR AUTOMATIC DATA MANAGEMENT
-- ============================================================

-- Function to update updated_at timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Add updated_at triggers to all relevant tables
DROP TRIGGER IF EXISTS update_user_settings_updated_at ON public.user_settings;
CREATE TRIGGER update_user_settings_updated_at
  BEFORE UPDATE ON public.user_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Function to automatically create user settings on profile creation
CREATE OR REPLACE FUNCTION create_default_user_settings()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_settings (user_id, tenant_id, preferences)
  VALUES (
    NEW.id,
    NEW.tenant_id,
    '{
      "notifications": {"email": true, "push": true, "shift_reminders": true},
      "dashboard": {"theme": "light", "layout": "grid"},
      "privacy": {"show_location": true, "show_activity": false}
    }'::jsonb
  )
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create user settings when profile is created
DROP TRIGGER IF EXISTS create_user_settings_trigger ON public.profiles;
CREATE TRIGGER create_user_settings_trigger
  AFTER INSERT ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION create_default_user_settings();

-- ============================================================
-- STEP 4: ENHANCED ROW LEVEL SECURITY POLICIES
-- ============================================================

-- Enable RLS on new tables
ALTER TABLE public.user_activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.data_sync ENABLE ROW LEVEL SECURITY;

-- User Activities Policies
CREATE POLICY "user_activities_select_own_tenant"
  ON public.user_activities FOR SELECT
  USING (
    tenant_id IN (SELECT tenant_id FROM public.tenant_memberships WHERE user_id = auth.uid() AND status = 'active')
  );

CREATE POLICY "user_activities_insert_own"
  ON public.user_activities FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- Notifications Policies
CREATE POLICY "notifications_select_own"
  ON public.notifications FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "notifications_update_own"
  ON public.notifications FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "notifications_insert_tenant_admins"
  ON public.notifications FOR INSERT
  WITH CHECK (
    tenant_id IN (
      SELECT tenant_id FROM public.tenant_memberships 
      WHERE user_id = auth.uid() 
      AND role IN ('company_admin', 'company_manager') 
      AND status = 'active'
    )
  );

-- User Settings Policies
CREATE POLICY "user_settings_select_own"
  ON public.user_settings FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "user_settings_insert_own"
  ON public.user_settings FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "user_settings_update_own"
  ON public.user_settings FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Data Sync Policies
CREATE POLICY "data_sync_select_own_tenant"
  ON public.data_sync FOR SELECT
  USING (
    tenant_id IN (SELECT tenant_id FROM public.tenant_memberships WHERE user_id = auth.uid() AND status = 'active')
  );

CREATE POLICY "data_sync_insert_own"
  ON public.data_sync FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- ============================================================
-- STEP 5: ENHANCED HELPER FUNCTIONS
-- ============================================================

-- Function to log user activity
CREATE OR REPLACE FUNCTION log_user_activity(
  p_activity_type TEXT,
  p_activity_data JSONB DEFAULT '{}'::jsonb
)
RETURNS UUID AS $$
DECLARE
  activity_id UUID;
  user_tenant_id UUID;
BEGIN
  -- Get user's current tenant
  SELECT tenant_id INTO user_tenant_id
  FROM public.tenant_memberships
  WHERE user_id = auth.uid() AND status = 'active'
  LIMIT 1;

  INSERT INTO public.user_activities (tenant_id, user_id, activity_type, activity_data)
  VALUES (user_tenant_id, auth.uid(), p_activity_type, p_activity_data)
  RETURNING id INTO activity_id;

  RETURN activity_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to create notification
CREATE OR REPLACE FUNCTION create_notification(
  p_user_id UUID,
  p_title TEXT,
  p_message TEXT,
  p_type TEXT DEFAULT 'info',
  p_action_url TEXT DEFAULT NULL,
  p_metadata JSONB DEFAULT '{}'::jsonb
)
RETURNS UUID AS $$
DECLARE
  notification_id UUID;
  user_tenant_id UUID;
BEGIN
  -- Get user's tenant
  SELECT tenant_id INTO user_tenant_id
  FROM public.tenant_memberships
  WHERE user_id = p_user_id AND status = 'active'
  LIMIT 1;

  INSERT INTO public.notifications (tenant_id, user_id, title, message, type, action_url, metadata)
  VALUES (user_tenant_id, p_user_id, p_title, p_message, p_type, p_action_url, p_metadata)
  RETURNING id INTO notification_id;

  RETURN notification_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to backup data
CREATE OR REPLACE FUNCTION backup_user_data(
  p_table_name TEXT,
  p_record_id UUID
)
RETURNS UUID AS $$
DECLARE
  backup_id UUID;
  data_snapshot JSONB;
  user_tenant_id UUID;
BEGIN
  -- Get user's tenant
  SELECT tenant_id INTO user_tenant_id
  FROM public.tenant_memberships
  WHERE user_id = auth.uid() AND status = 'active'
  LIMIT 1;

  -- Create backup record (data_snapshot will be populated by application)
  INSERT INTO public.data_sync (tenant_id, user_id, sync_type, table_name, record_id, data_snapshot)
  VALUES (user_tenant_id, auth.uid(), 'backup', p_table_name, p_record_id, '{}'::jsonb)
  RETURNING id INTO backup_id;

  RETURN backup_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get user statistics
CREATE OR REPLACE FUNCTION get_user_stats(p_user_id UUID DEFAULT auth.uid())
RETURNS JSONB AS $$
DECLARE
  stats JSONB;
BEGIN
  WITH user_data AS (
    SELECT 
      (SELECT COUNT(*) FROM public.shifts WHERE user_id = p_user_id) as total_shifts,
      (SELECT COUNT(*) FROM public.timesheets WHERE user_id = p_user_id AND approval_status = 'approved') as approved_hours,
      (SELECT COUNT(*) FROM public.certificates WHERE user_id = p_user_id) as certificates,
      (SELECT COUNT(*) FROM public.user_activities WHERE user_id = p_user_id AND created_at >= NOW() - INTERVAL '30 days') as recent_activity
  )
  SELECT to_jsonb(user_data.*) INTO stats FROM user_data;
  
  RETURN stats;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- STEP 6: REAL-TIME SUBSCRIPTIONS SETUP
-- ============================================================

-- Enable real-time for key tables
ALTER publication supabase_realtime ADD TABLE public.notifications;
ALTER publication supabase_realtime ADD TABLE public.user_activities;
ALTER publication supabase_realtime ADD TABLE public.shifts;
ALTER publication supabase_realtime ADD TABLE public.timesheets;

-- ============================================================
-- STEP 7: ADD COMPREHENSIVE COMMENTS
-- ============================================================

COMMENT ON TABLE public.user_activities IS 'Tracks all user activities for analytics and audit purposes';
COMMENT ON TABLE public.notifications IS 'In-app notifications for users';
COMMENT ON TABLE public.user_settings IS 'User preferences and settings';
COMMENT ON TABLE public.data_sync IS 'Data backup and synchronization tracking';

COMMENT ON FUNCTION log_user_activity(TEXT, JSONB) IS 'Logs user activity with tenant context';
COMMENT ON FUNCTION create_notification(UUID, TEXT, TEXT, TEXT, TEXT, JSONB) IS 'Creates notifications for users';
COMMENT ON FUNCTION backup_user_data(TEXT, UUID) IS 'Creates data backup entries';
COMMENT ON FUNCTION get_user_stats(UUID) IS 'Returns comprehensive user statistics';

-- ============================================================
-- VERIFICATION QUERIES
-- ============================================================

-- Check all tables exist
SELECT 
  table_name,
  table_type
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('tenants', 'tenant_memberships', 'user_activities', 'notifications', 'user_settings', 'data_sync')
ORDER BY table_name;

-- Check RLS is enabled
SELECT 
  schemaname, 
  tablename, 
  rowsecurity
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('tenants', 'tenant_memberships', 'user_activities', 'notifications', 'user_settings', 'data_sync')
ORDER BY tablename;

-- Check functions exist
SELECT 
  routine_name,
  routine_type
FROM information_schema.routines
WHERE routine_schema = 'public'
AND routine_name IN ('log_user_activity', 'create_notification', 'backup_user_data', 'get_user_stats')
ORDER BY routine_name;

-- Success message
SELECT 'Enhanced database schema setup completed successfully!' as message;