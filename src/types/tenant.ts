export interface Tenant {
  id: string;
  name: string;
  slug: string;
  domain?: string;
  settings: Record<string, any>;
  subscription_tier: 'starter' | 'professional' | 'enterprise';
  subscription_status: 'active' | 'suspended' | 'cancelled';
  max_users: number;
  stripe_customer_id?: string;
  billing_email?: string;
  created_at: string;
  updated_at: string;
}

export interface TenantMembership {
  id: string;
  tenant_id: string;
  user_id: string;
  role: 'company_admin' | 'company_manager' | 'part_timer';
  status: 'active' | 'invited' | 'suspended';
  invited_by?: string;
  invited_at?: string;
  joined_at: string;
  created_at: string;
  updated_at: string;
  
  // Relations
  tenant?: Tenant;
}

export interface TenantContext {
  currentTenant: Tenant | null;
  userMemberships: TenantMembership[];
  userRole: 'company_admin' | 'company_manager' | 'part_timer' | null;
  switchTenant: (tenantId: string) => Promise<void>;
  isLoading: boolean;
  error: string | null;
}

export interface ShiftAssignment {
  id: string;
  tenant_id: string;
  shift_id: string;
  part_timer_id: string;
  assigned_by: string;
  status: 'assigned' | 'accepted' | 'declined' | 'completed' | 'no_show';
  assigned_at: string;
  responded_at?: string;
  created_at: string;
  updated_at: string;
}

export interface AuditLog {
  id: string;
  tenant_id?: string;
  user_id?: string;
  action: 'create' | 'update' | 'delete' | 'login' | 'logout' | 'invite' | 'approve' | 'reject';
  resource_type: 'shift' | 'certificate' | 'timesheet' | 'assignment' | 'user' | 'tenant';
  resource_id?: string;
  old_values?: Record<string, any>;
  new_values?: Record<string, any>;
  ip_address?: string;
  user_agent?: string;
  created_at: string;
}

// Extended types for existing entities with tenant support
export interface TenantShift {
  id: string;
  tenant_id: string;
  title: string;
  description?: string;
  date: string;
  location: string;
  assigned_count: number;
  hourly_rate?: number;
  created_at: string;
  updated_at: string;
}

export interface TenantTimesheet {
  id: string;
  tenant_id: string;
  user_id: string;
  shift_id?: string;
  shift_assignment_id?: string;
  start_time: string;
  end_time?: string;
  approved_by?: string;
  approval_status: 'pending' | 'approved' | 'rejected';
  approved_at?: string;
  hourly_rate?: number;
  total_earnings?: number;
  created_at: string;
  updated_at: string;
}