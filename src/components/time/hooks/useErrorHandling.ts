
import { useState, useCallback } from "react";
import { toast } from "sonner";

export function useErrorHandling() {
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleError = useCallback((key: string, message: string, showToast = true) => {
    setErrors(prev => ({ ...prev, [key]: message }));
    
    if (showToast) {
      toast.error(message);
    }
    
    return false;
  }, []);

  const clearError = useCallback((key: string) => {
    setErrors(prev => {
      const newErrors = { ...prev };
      delete newErrors[key];
      return newErrors;
    });
  }, []);

  const clearAllErrors = useCallback(() => {
    setErrors({});
  }, []);

  return {
    errors,
    handleError,
    clearError,
    clearAllErrors,
    hasErrors: Object.keys(errors).length > 0
  };
}
