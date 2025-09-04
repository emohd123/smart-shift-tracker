import { useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useSecurityMonitoring } from './useSecurityMonitoring';

export const useAdminValidation = () => {
  const { user } = useAuth();
  const { logUnauthorizedAccess, logAdminAction } = useSecurityMonitoring();

  const isAdmin = useCallback(() => {
    return user?.role === 'admin';
  }, [user]);

  const requireAdmin = useCallback((action?: string) => {
    if (!isAdmin()) {
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