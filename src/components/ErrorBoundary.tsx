import React, { Component, ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { AlertTriangle, RefreshCw, Home, ChevronLeft } from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from './ui/card';
import { Alert, AlertDescription, AlertTitle } from './ui/alert';
import { ROUTES } from '@/utils/routes';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  showDetails?: boolean;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: React.ErrorInfo | null;
  errorId: string;
}

export class ErrorBoundary extends Component<Props, State> {
  private retryCount = 0;
  private maxRetries = 3;

  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: ''
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    // Generate a unique error ID for tracking
    const errorId = `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    return {
      hasError: true,
      error,
      errorId
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    this.setState({
      error,
      errorInfo
    });

    // Log the error for debugging
    console.error('ErrorBoundary caught an error:', {
      error: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
      errorId: this.state.errorId
    });

    // Report error to monitoring service (if available)
    this.reportError(error, errorInfo);
  }

  private reportError = (error: Error, errorInfo: React.ErrorInfo) => {
    // In a real app, you would send this to your error reporting service
    const errorReport = {
      message: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
      timestamp: new Date().toISOString(),
      url: window.location.href,
      userAgent: navigator.userAgent,
      errorId: this.state.errorId
    };

    // For now, just log to console
    console.error('Error Report:', errorReport);

    // You could send to services like Sentry, LogRocket, etc.
    // Example: Sentry.captureException(error, { contexts: { react: errorInfo } });
  };

  private handleRetry = () => {
    if (this.retryCount < this.maxRetries) {
      this.retryCount++;
      this.setState({
        hasError: false,
        error: null,
        errorInfo: null,
        errorId: ''
      });
    } else {
      // Max retries reached, refresh the page
      window.location.reload();
    }
  };

  private getErrorType = (error: Error): string => {
    if (error.message.includes('ChunkLoadError') || error.message.includes('Loading chunk')) {
      return 'chunk_load';
    }
    if (error.message.includes('Network')) {
      return 'network';
    }
    if (error.message.includes('TypeError')) {
      return 'type_error';
    }
    if (error.message.includes('ReferenceError')) {
      return 'reference_error';
    }
    return 'unknown';
  };

  private getErrorMessage = (error: Error): { title: string; description: string; canRetry: boolean } => {
    const errorType = this.getErrorType(error);

    switch (errorType) {
      case 'chunk_load':
        return {
          title: 'Loading Error',
          description: 'Failed to load application resources. This might be due to a network issue or an app update.',
          canRetry: true
        };
      case 'network':
        return {
          title: 'Network Error',
          description: 'Unable to connect to the server. Please check your internet connection.',
          canRetry: true
        };
      case 'type_error':
      case 'reference_error':
        return {
          title: 'Application Error',
          description: 'Something went wrong with the application. Our team has been notified.',
          canRetry: false
        };
      default:
        return {
          title: 'Unexpected Error',
          description: 'An unexpected error occurred. Please try refreshing the page.',
          canRetry: true
        };
    }
  };

  render() {
    if (this.state.hasError) {
      // Custom fallback UI
      if (this.props.fallback) {
        return this.props.fallback;
      }

      const { error } = this.state;
      const errorDetails = error ? this.getErrorMessage(error) : {
        title: 'Unknown Error',
        description: 'An unknown error occurred.',
        canRetry: false
      };

      return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-background to-secondary/10 px-4">
          <Card className="max-w-md w-full border-destructive/20">
            <CardHeader className="text-center">
              <div className="mx-auto p-3 rounded-full bg-destructive/10 mb-4">
                <AlertTriangle className="h-8 w-8 text-destructive" />
              </div>
              <CardTitle className="text-xl">{errorDetails.title}</CardTitle>
            </CardHeader>

            <CardContent className="space-y-4">
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>Error Details</AlertTitle>
                <AlertDescription>
                  {errorDetails.description}
                </AlertDescription>
              </Alert>

              {this.props.showDetails && error && (
                <Alert variant="destructive">
                  <AlertTitle>Technical Details</AlertTitle>
                  <AlertDescription className="text-sm font-mono break-all">
                    <details>
                      <summary className="cursor-pointer mb-2">View Error Details</summary>
                      <div className="whitespace-pre-wrap text-xs">
                        {error.message}
                        {error.stack && (
                          <div className="mt-2 pt-2 border-t border-destructive/20">
                            {error.stack}
                          </div>
                        )}
                      </div>
                    </details>
                  </AlertDescription>
                </Alert>
              )}

              <div className="text-center text-sm text-muted-foreground">
                Error ID: <span className="font-mono text-xs">{this.state.errorId}</span>
              </div>
            </CardContent>

            <CardFooter className="flex flex-col space-y-2">
              {errorDetails.canRetry && (
                <Button 
                  onClick={this.handleRetry} 
                  className="w-full"
                  disabled={this.retryCount >= this.maxRetries}
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  {this.retryCount >= this.maxRetries ? 'Reload Page' : `Try Again (${this.maxRetries - this.retryCount} left)`}
                </Button>
              )}

              <div className="flex gap-2 w-full">
                <Button 
                  variant="outline" 
                  onClick={() => window.history.back()} 
                  className="flex-1"
                >
                  <ChevronLeft className="h-4 w-4 mr-2" />
                  Go Back
                </Button>

                <Button variant="outline" asChild className="flex-1">
                  <Link to={ROUTES.HOME}>
                    <Home className="h-4 w-4 mr-2" />
                    Home
                  </Link>
                </Button>
              </div>
            </CardFooter>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}

// Route-specific error boundary for better UX
export const RouteErrorBoundary: React.FC<{ children: ReactNode; routeName?: string }> = ({ 
  children, 
  routeName 
}) => {
  return (
    <ErrorBoundary
      showDetails={process.env.NODE_ENV === 'development'}
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <Card className="max-w-sm w-full">
            <CardHeader className="text-center">
              <AlertTriangle className="h-8 w-8 text-destructive mx-auto mb-2" />
              <CardTitle>Page Error</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-center text-sm text-muted-foreground">
                {routeName ? `Error loading ${routeName} page.` : 'Error loading this page.'}
              </p>
            </CardContent>
            <CardFooter>
              <Button asChild className="w-full">
                <Link to={ROUTES.HOME}>Return Home</Link>
              </Button>
            </CardFooter>
          </Card>
        </div>
      }
    >
      {children}
    </ErrorBoundary>
  );
};

export default ErrorBoundary;