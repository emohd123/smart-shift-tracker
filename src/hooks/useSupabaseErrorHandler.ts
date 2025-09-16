import { useToast } from './use-toast';
import { supabase } from '@/integrations/supabase/client';

export interface SupabaseError {
  code?: string;
  message: string;
  details?: string;
  hint?: string;
}

// Type guard to check if error is a Supabase error
const isSupabaseError = (error: unknown): error is SupabaseError => {
  return (
    typeof error === 'object' &&
    error !== null &&
    'message' in error &&
    typeof (error as SupabaseError).message === 'string'
  );
};

export interface ErrorHandlerOptions {
  showToast?: boolean;
  logError?: boolean;
  fallbackMessage?: string;
}

export const useSupabaseErrorHandler = () => {
  const { toast } = useToast();

  const handleError = async (
    error: unknown,
    operation: string,
    options: ErrorHandlerOptions = {}
  ) => {
    const {
      showToast = true,
      logError = true,
      fallbackMessage = 'An unexpected error occurred'
    } = options;

    // Parse Supabase error with type safety
    const supabaseError: SupabaseError = isSupabaseError(error) ? {
      code: error.code,
      message: error.message,
      details: error.details,
      hint: error.hint
    } : {
      message: fallbackMessage
    };

    // Enhanced error messages based on common Supabase error codes
    let userMessage = supabaseError.message;
    let errorTitle = 'Error';

    switch (supabaseError.code) {
      case 'PGRST301':
        errorTitle = 'Permission Denied';
        userMessage = 'You don\'t have permission to perform this action';
        break;
      case 'PGRST116':
        errorTitle = 'Not Found';
        userMessage = 'The requested resource was not found';
        break;
      case '23505':
        errorTitle = 'Duplicate Entry';
        userMessage = 'This item already exists';
        break;
      case '23503':
        errorTitle = 'Invalid Reference';
        userMessage = 'Referenced item no longer exists';
        break;
      case '23502':
        errorTitle = 'Missing Required Field';
        userMessage = 'Please fill in all required fields';
        break;
      case 'PGRST202':
        errorTitle = 'Function Not Found';
        userMessage = 'This feature is not available right now';
        break;
      case 'PGRST204':
      case 'PGRST205':
        errorTitle = 'Database Error';
        userMessage = 'Database connection issue. Please try again.';
        break;
      case '42501':
        errorTitle = 'Access Denied';
        userMessage = 'You don\'t have sufficient permissions';
        break;
      case '42P01':
        errorTitle = 'Configuration Error';
        userMessage = 'System configuration issue. Please contact support.';
        break;
      default:
        if (supabaseError.message?.includes('JWT')) {
          errorTitle = 'Session Expired';
          userMessage = 'Your session has expired. Please refresh the page.';
        } else if (supabaseError.message?.includes('fetch')) {
          errorTitle = 'Connection Error';
          userMessage = 'Unable to connect. Please check your internet connection.';
        } else if (supabaseError.message?.includes('timeout')) {
          errorTitle = 'Timeout Error';
          userMessage = 'Request timed out. Please try again.';
        }
        break;
    }

    // Show user-friendly toast notification
    if (showToast) {
      toast({
        title: errorTitle,
        description: userMessage,
        variant: 'destructive'
      });
    }

    // Log error for debugging and monitoring
    if (logError) {
      try {
        console.error(`Supabase Error in ${operation}:`, {
          code: supabaseError.code,
          message: supabaseError.message,
          details: supabaseError.details,
          hint: supabaseError.hint,
          timestamp: new Date().toISOString()
        });

        // Log to database for monitoring (don't await to avoid blocking)
        supabase.rpc('log_user_activity', {
          p_activity_type: 'error_encountered',
          p_activity_data: {
            operation,
            error_code: supabaseError.code,
            error_message: supabaseError.message,
            user_message: userMessage
          }
        }).catch(logError => {
          console.warn('Failed to log error to database:', logError);
        });
      } catch (loggingError) {
        console.warn('Error logging failed:', loggingError);
      }
    }

    return {
      code: supabaseError.code,
      message: userMessage,
      title: errorTitle,
      originalError: supabaseError
    };
  };

  const isRetryableError = (error: unknown): boolean => {
    if (!isSupabaseError(error)) return false;
    
    const retryableCodes = [
      'PGRST204', // Connection issues
      'PGRST205', // Connection issues
      'ECONNRESET', // Network issues
      'ETIMEDOUT', // Timeout issues
      'ENOTFOUND' // DNS issues
    ];

    const retryableMessages = [
      'fetch',
      'network',
      'timeout',
      'connection'
    ];

    if (error.code && retryableCodes.includes(error.code)) {
      return true;
    }

    if (error.message) {
      const message = error.message.toLowerCase();
      return retryableMessages.some(keyword => message.includes(keyword));
    }

    return false;
  };

  const getErrorMetadata = (error: unknown) => {
    const supabaseError = isSupabaseError(error) ? error : { message: 'Unknown error' };
    
    return {
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href,
      code: supabaseError.code,
      message: supabaseError.message,
      details: supabaseError.details,
      hint: supabaseError.hint
    };
  };

  return {
    handleError,
    isRetryableError,
    getErrorMetadata
  };
};

// Utility for handling form submissions with proper error handling
export const useFormErrorHandler = () => {
  const { handleError } = useSupabaseErrorHandler();

  const handleFormError = async (error: unknown, formName: string) => {
    // Special handling for form validation errors
    const errorMessage = isSupabaseError(error) ? error.message : 'An error occurred';
    
    if (errorMessage?.includes('required')) {
      const formError = isSupabaseError(error) 
        ? { ...error, code: 'FORM_VALIDATION' }
        : { message: 'Please fill in all required fields', code: 'FORM_VALIDATION' };
      
      return await handleError(
        formError,
        `${formName}_form_validation`,
        { fallbackMessage: 'Please fill in all required fields' }
      );
    }

    return await handleError(error, `${formName}_form_submission`);
  };

  return { handleFormError };
};