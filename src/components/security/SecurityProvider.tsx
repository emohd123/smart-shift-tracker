import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { generateCSRFToken, validateCSRFToken, createCSPDirective, generateNonce } from '@/utils/validation';
import { useRateLimit } from '@/hooks/security/useRateLimit';

interface SecurityContextType {
  csrfToken: string;
  nonce: string;
  isSecure: boolean;
  validateRequest: (token: string) => boolean;
  refreshCSRFToken: () => void;
  rateLimit: ReturnType<typeof useRateLimit>;
}

const SecurityContext = createContext<SecurityContextType | null>(null);

export const SecurityProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [csrfToken, setCSRFToken] = useState('');
  const [nonce, setNonce] = useState('');
  const [isSecure, setIsSecure] = useState(false);

  // Rate limiting for general API requests
  const rateLimit = useRateLimit({
    maxAttempts: 100,
    windowMs: 60 * 1000, // 1 minute
    message: 'Too many requests. Please slow down.'
  });

  useEffect(() => {
    // Initialize security tokens
    const initializeSecurity = () => {
      const token = generateCSRFToken();
      const nonceValue = generateNonce();
      
      setCSRFToken(token);
      setNonce(nonceValue);
      
      // Set CSP header via meta tag
      const cspMeta = document.createElement('meta');
      cspMeta.httpEquiv = 'Content-Security-Policy';
      cspMeta.content = createCSPDirective(nonceValue);
      document.head.appendChild(cspMeta);
      
      // Check if connection is secure
      setIsSecure(window.location.protocol === 'https:');
      
      // Store CSRF token in session storage for API requests
      sessionStorage.setItem('csrf-token', token);
    };

    initializeSecurity();
  }, []);

  const validateRequest = useCallback((token: string) => {
    return validateCSRFToken(token, csrfToken);
  }, [csrfToken]);

  const refreshCSRFToken = useCallback(() => {
    const newToken = generateCSRFToken();
    setCSRFToken(newToken);
    sessionStorage.setItem('csrf-token', newToken);
  }, []);

  const value: SecurityContextType = {
    csrfToken,
    nonce,
    isSecure,
    validateRequest,
    refreshCSRFToken,
    rateLimit
  };

  return (
    <SecurityContext.Provider value={value}>
      {children}
    </SecurityContext.Provider>
  );
};

export const useSecurity = (): SecurityContextType => {
  const context = useContext(SecurityContext);
  if (!context) {
    throw new Error('useSecurity must be used within a SecurityProvider');
  }
  return context;
};

// Hook for secure API requests
export const useSecureRequest = () => {
  const { csrfToken, validateRequest, rateLimit } = useSecurity();

  const makeSecureRequest = useCallback(async (
    url: string,
    options: RequestInit = {}
  ) => {
    // Check rate limit first
    if (!rateLimit.checkRateLimit() || rateLimit.isBlocked) {
      throw new Error(rateLimit.message);
    }

    // Record the attempt
    rateLimit.recordAttempt();

    // Add CSRF token to headers
    const headers = {
      'Content-Type': 'application/json',
      'X-CSRF-Token': csrfToken,
      ...options.headers
    };

    const response = await fetch(url, {
      ...options,
      headers,
      credentials: 'same-origin' // Include cookies for session management
    });

    if (!response.ok) {
      throw new Error(`Request failed: ${response.statusText}`);
    }

    return response;
  }, [csrfToken, rateLimit]);

  return { makeSecureRequest, isBlocked: rateLimit.isBlocked };
};