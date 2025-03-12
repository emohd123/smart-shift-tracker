
import React, { createContext, useContext, useState, ReactNode, useCallback } from 'react';
import { toast } from 'sonner';

export enum ErrorSeverity {
  INFO = 'info',
  WARNING = 'warning',
  ERROR = 'error',
  FATAL = 'fatal',
}

export interface AppError {
  id: string;
  message: string;
  severity: ErrorSeverity;
  timestamp: Date;
  details?: unknown;
  handled: boolean;
}

interface ErrorContextType {
  errors: AppError[];
  addError: (message: string, severity?: ErrorSeverity, details?: unknown) => void;
  clearError: (id: string) => void;
  clearAllErrors: () => void;
  hasErrors: boolean;
  hasFatalErrors: boolean;
}

const ErrorContext = createContext<ErrorContextType>({
  errors: [],
  addError: () => {},
  clearError: () => {},
  clearAllErrors: () => {},
  hasErrors: false,
  hasFatalErrors: false,
});

export const useError = () => useContext(ErrorContext);

export const ErrorProvider = ({ children }: { children: ReactNode }) => {
  const [errors, setErrors] = useState<AppError[]>([]);

  const addError = useCallback((message: string, severity: ErrorSeverity = ErrorSeverity.ERROR, details?: unknown) => {
    const newError: AppError = {
      id: Date.now().toString(),
      message,
      severity,
      timestamp: new Date(),
      details,
      handled: false,
    };

    setErrors((prev) => [...prev, newError]);

    // Show toast for the error based on severity
    switch (severity) {
      case ErrorSeverity.INFO:
        toast.info(message);
        break;
      case ErrorSeverity.WARNING:
        toast.warning(message);
        break;
      case ErrorSeverity.ERROR:
        toast.error(message);
        break;
      case ErrorSeverity.FATAL:
        toast.error(message, {
          description: 'A critical error occurred. Please refresh the page or contact support.',
          duration: 8000,
        });
        break;
    }

    // Log to console for debugging
    console.error(`[${severity.toUpperCase()}] ${message}`, details);

    return newError.id;
  }, []);

  const clearError = useCallback((id: string) => {
    setErrors((prev) => prev.filter((error) => error.id !== id));
  }, []);

  const clearAllErrors = useCallback(() => {
    setErrors([]);
  }, []);

  const hasErrors = errors.length > 0;
  const hasFatalErrors = errors.some((error) => error.severity === ErrorSeverity.FATAL);

  return (
    <ErrorContext.Provider
      value={{
        errors,
        addError,
        clearError,
        clearAllErrors,
        hasErrors,
        hasFatalErrors,
      }}
    >
      {children}
    </ErrorContext.Provider>
  );
};

// Global error boundary component
export class ErrorBoundary extends React.Component<
  { children: ReactNode; fallback?: ReactNode },
  { hasError: boolean }
> {
  static contextType = ErrorContext;
  
  constructor(props: { children: ReactNode; fallback?: ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    // Access error context and log the error
    const errorContext = this.context as ErrorContextType;
    if (errorContext && errorContext.addError) {
      errorContext.addError(error.message, ErrorSeverity.FATAL, {
        stack: error.stack,
        componentStack: info.componentStack,
      });
    }
    console.error('Uncaught error:', error, info);
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback || (
        <div className="flex flex-col items-center justify-center h-screen p-4">
          <h2 className="text-2xl font-bold mb-4">Something went wrong</h2>
          <p className="mb-4 text-center">We're sorry, but an error occurred while rendering this page.</p>
          <button
            className="px-4 py-2 bg-primary text-white rounded hover:bg-primary/90"
            onClick={() => window.location.reload()}
          >
            Refresh Page
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
