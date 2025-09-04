import { useState, useCallback, useRef } from 'react';

interface RateLimitConfig {
  maxAttempts: number;
  windowMs: number;
  message?: string;
}

interface RateLimitState {
  attempts: number;
  lastAttempt: number;
  isBlocked: boolean;
}

export const useRateLimit = (config: RateLimitConfig) => {
  const [state, setState] = useState<RateLimitState>({
    attempts: 0,
    lastAttempt: 0,
    isBlocked: false
  });

  const timeoutRef = useRef<NodeJS.Timeout>();

  const checkRateLimit = useCallback(() => {
    const now = Date.now();
    const timeSinceLastAttempt = now - state.lastAttempt;

    // Reset if window has passed
    if (timeSinceLastAttempt > config.windowMs) {
      setState({
        attempts: 0,
        lastAttempt: now,
        isBlocked: false
      });
      return true;
    }

    // Check if blocked
    if (state.attempts >= config.maxAttempts) {
      return false;
    }

    return true;
  }, [state, config]);

  const recordAttempt = useCallback(() => {
    const now = Date.now();
    const newAttempts = state.attempts + 1;
    const isBlocked = newAttempts >= config.maxAttempts;

    setState({
      attempts: newAttempts,
      lastAttempt: now,
      isBlocked
    });

    // Auto-reset after window
    if (isBlocked && timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    
    if (isBlocked) {
      timeoutRef.current = setTimeout(() => {
        setState({
          attempts: 0,
          lastAttempt: 0,
          isBlocked: false
        });
      }, config.windowMs);
    }

    return !isBlocked;
  }, [state, config]);

  const reset = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    setState({
      attempts: 0,
      lastAttempt: 0,
      isBlocked: false
    });
  }, []);

  const getRemainingTime = useCallback(() => {
    if (!state.isBlocked) return 0;
    const elapsed = Date.now() - state.lastAttempt;
    return Math.max(0, config.windowMs - elapsed);
  }, [state, config]);

  return {
    isBlocked: state.isBlocked,
    attempts: state.attempts,
    maxAttempts: config.maxAttempts,
    remainingTime: getRemainingTime(),
    checkRateLimit,
    recordAttempt,
    reset,
    message: config.message || `Too many attempts. Please try again later.`
  };
};