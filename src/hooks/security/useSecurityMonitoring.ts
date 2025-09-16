import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface SecurityEvent {
  event_type: 'login_attempt' | 'signup_attempt' | 'role_change' | 'failed_validation' | 'admin_action' | 'profile_update' | 'unauthorized_access';
  user_id?: string;
  ip_address?: string;
  user_agent?: string;
  details?: Record<string, unknown>;
  severity?: 'low' | 'medium' | 'high' | 'critical';
}

export const useSecurityMonitoring = () => {
  const [isLogging, setIsLogging] = useState(false);

  const logSecurityEvent = useCallback(async (event: SecurityEvent) => {
    try {
      setIsLogging(true);
      
      // Get client info
      const clientInfo = {
        ip_address: event.ip_address || 'unknown',
        user_agent: event.user_agent || navigator.userAgent,
        timestamp: new Date().toISOString(),
        ...event.details
      };

      // Log to notifications table as security audit
      if (event.user_id) {
        await supabase
          .from('notifications')
          .insert({
            user_id: event.user_id,
            title: `Security Event: ${event.event_type}`,
            message: JSON.stringify(clientInfo),
            type: 'security_audit'
          });
      }

      console.log('Security event logged:', event.event_type, clientInfo);
    } catch (error) {
      console.error('Failed to log security event:', error);
    } finally {
      setIsLogging(false);
    }
  }, []);

  const logFailedLogin = useCallback((email: string, reason: string) => {
    logSecurityEvent({
      event_type: 'login_attempt',
      details: {
        email: email.replace(/(.{2}).*(@.*)/, '$1***$2'), // Partially mask email
        success: false,
        failure_reason: reason
      }
    });
  }, [logSecurityEvent]);

  const logSuccessfulLogin = useCallback((userId: string) => {
    logSecurityEvent({
      event_type: 'login_attempt',
      user_id: userId,
      details: {
        success: true
      }
    });
  }, [logSecurityEvent]);

  const logSignupAttempt = useCallback((email: string, success: boolean, reason?: string) => {
    logSecurityEvent({
      event_type: 'signup_attempt',
      details: {
        email: email.replace(/(.{2}).*(@.*)/, '$1***$2'), // Partially mask email
        success,
        failure_reason: reason
      }
    });
  }, [logSecurityEvent]);

  const logValidationFailure = useCallback((field: string, reason: string, userId?: string) => {
    logSecurityEvent({
      event_type: 'failed_validation',
      user_id: userId,
      details: {
        field,
        reason
      },
      severity: 'medium'
    });
  }, [logSecurityEvent]);

  const logAdminAction = useCallback((action: string, userId: string, target?: string) => {
    logSecurityEvent({
      event_type: 'admin_action',
      user_id: userId,
      details: {
        action,
        target
      },
      severity: 'high'
    });
  }, [logSecurityEvent]);

  const logProfileUpdate = useCallback((userId: string, fields: string[]) => {
    logSecurityEvent({
      event_type: 'profile_update',
      user_id: userId,
      details: {
        updated_fields: fields
      },
      severity: 'low'
    });
  }, [logSecurityEvent]);

  const logUnauthorizedAccess = useCallback((userId?: string, resource?: string) => {
    logSecurityEvent({
      event_type: 'unauthorized_access',
      user_id: userId,
      details: {
        resource,
        attempted_at: new Date().toISOString()
      },
      severity: 'critical'
    });
  }, [logSecurityEvent]);

  return {
    logSecurityEvent,
    logFailedLogin,
    logSuccessfulLogin,
    logSignupAttempt,
    logValidationFailure,
    logAdminAction,
    logProfileUpdate,
    logUnauthorizedAccess,
    isLogging
  };
};