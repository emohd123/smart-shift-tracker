import { useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useSecurityMonitoring } from './useSecurityMonitoring';
import { supabase } from '@/integrations/supabase/client';

export const useAdminValidation = () => {
  const { user } = useAuth();
  const { logUnauthorizedAccess, logAdminAction } = useSecurityMonitoring();

  const isAdmin = useCallback(async () => {
    if (!user?.id) return false;
    
    // Use server-side has_role function for security
    const { data, error } = await supabase.rpc('has_role', {
      _user_id: user.id,
      _role: 'admin'
    });
    
    if (error) {
      console.error('Error checking admin role:', error);
      return false;
    }
    
    return data === true;
  }, [user]);

  const requireAdmin = useCallback(async (action?: string) => {
    const adminStatus = await isAdmin();
    
    if (!adminStatus) {
      logUnauthorizedAccess(user?.id, action);
      throw new Error('Access denied: Admin privileges required');
    }
    
    if (action && user?.id) {
      logAdminAction(action, user.id);
    }
    
    return true;
  }, [isAdmin, user, logUnauthorizedAccess, logAdminAction]);

  const withAdminCheck = useCallback(<T extends (...args: any[]) => any>(
    fn: T,
    action?: string
  ): T => {
    return ((...args: Parameters<T>) => {
      requireAdmin(action);
      return fn(...args);
    }) as T;
  }, [requireAdmin]);

  return {
    isAdmin,
    requireAdmin,
    withAdminCheck
  };
};