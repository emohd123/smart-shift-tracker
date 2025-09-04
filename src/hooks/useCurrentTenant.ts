import { useState, useEffect, createContext, useContext } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';
import type { Tenant, TenantMembership, TenantContext } from '@/types/tenant';

const TenantContext = createContext<TenantContext | null>(null);

export const useCurrentTenant = () => {
  const context = useContext(TenantContext);
  if (!context) {
    throw new Error('useCurrentTenant must be used within TenantProvider');
  }
  return context;
};

export const useTenantManager = () => {
  const { user } = useAuth();
  const [currentTenant, setCurrentTenant] = useState<Tenant | null>(null);
  const [userMemberships, setUserMemberships] = useState<TenantMembership[]>([]);
  const [userRole, setUserRole] = useState<'company_admin' | 'company_manager' | 'part_timer' | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load user's tenant memberships and set active tenant
  const loadTenantData = async () => {
    if (!user) {
      setCurrentTenant(null);
      setUserMemberships([]);
      setUserRole(null);
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      // Fetch user's tenant memberships
      const { data: memberships, error: membershipsError } = await supabase
        .from('tenant_memberships')
        .select(`
          *,
          tenant:tenants(*)
        `)
        .eq('user_id', user.id)
        .eq('status', 'active');

      if (membershipsError) throw membershipsError;

      setUserMemberships(memberships || []);

      // Get stored active tenant or use first membership
      const storedTenantId = localStorage.getItem('activeTenantId');
      let activeMembership = memberships?.find(m => m.tenant_id === storedTenantId);
      
      if (!activeMembership && memberships?.length > 0) {
        activeMembership = memberships[0];
      }

      if (activeMembership?.tenant) {
        setCurrentTenant(activeMembership.tenant);
        setUserRole(activeMembership.role);
        localStorage.setItem('activeTenantId', activeMembership.tenant_id);
      } else {
        setCurrentTenant(null);
        setUserRole(null);
        localStorage.removeItem('activeTenantId');
      }
    } catch (err) {
      console.error('Error loading tenant data:', err);
      setError(err instanceof Error ? err.message : 'Failed to load tenant data');
    } finally {
      setIsLoading(false);
    }
  };

  // Switch active tenant
  const switchTenant = async (tenantId: string) => {
    const membership = userMemberships.find(m => m.tenant_id === tenantId);
    if (!membership?.tenant) {
      throw new Error('Tenant not found in user memberships');
    }

    setCurrentTenant(membership.tenant);
    setUserRole(membership.role);
    localStorage.setItem('activeTenantId', tenantId);
  };

  // Load data on user change
  useEffect(() => {
    loadTenantData();
  }, [user]);

  // Subscribe to membership changes
  useEffect(() => {
    if (!user) return;

    const subscription = supabase
      .channel('tenant_memberships')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'tenant_memberships',
        filter: `user_id=eq.${user.id}`
      }, () => {
        loadTenantData(); // Reload when memberships change
      })
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [user]);

  return {
    currentTenant,
    userMemberships,
    userRole,
    switchTenant,
    isLoading,
    error,
    reload: loadTenantData
  };
};

export { TenantContext };