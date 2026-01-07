/**
 * Production-safe logger utility
 * Logs to console in development, silent in production
 * Future: Can be extended to send errors to Sentry/other services
 */

const isDevelopment = import.meta.env.DEV;

export const logger = {
  log: (...args: any[]) => {
    if (isDevelopment) {
      console.log(...args);
    }
  },
  
  error: (...args: any[]) => {
    if (isDevelopment) {
      console.error(...args);
    }
    // Future: Send to error tracking service (Sentry)
    // if (import.meta.env.PROD) {
    //   Sentry.captureException(args[0]);
    // }
  },
  
  warn: (...args: any[]) => {
    if (isDevelopment) {
      console.warn(...args);
    }
  },
  
  info: (...args: any[]) => {
    if (isDevelopment) {
      console.info(...args);
    }
  },
  
  debug: (...args: any[]) => {
    if (isDevelopment) {
      console.debug(...args);
    }
  }
};
