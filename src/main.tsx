
import React, { Suspense, lazy } from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ErrorProvider, ErrorBoundary } from './context/ErrorContext';
import { Loader2 } from 'lucide-react';
import './index.css';

// Lazy load the App component for code splitting
const App = lazy(() => import('./App'));

// Loading fallback component
const LoadingFallback = () => (
  <div className="flex items-center justify-center h-screen bg-background">
    <div className="flex flex-col items-center">
      <Loader2 className="h-10 w-10 animate-spin text-primary mb-4" />
      <p className="text-muted-foreground">Loading application...</p>
    </div>
  </div>
);

// Create root only once and store it
const rootElement = document.getElementById('root');
if (!rootElement) throw new Error('Failed to find the root element');

const root = ReactDOM.createRoot(rootElement);

root.render(
  <React.StrictMode>
    <ErrorProvider>
      <ErrorBoundary>
        <BrowserRouter>
          <AuthProvider>
            <Suspense fallback={<LoadingFallback />}>
              <App />
            </Suspense>
          </AuthProvider>
        </BrowserRouter>
      </ErrorBoundary>
    </ErrorProvider>
  </React.StrictMode>
);
