import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Suspense, lazy } from "react";
import { ErrorProvider } from "./context/ErrorContext";
import { AuthProvider } from "./context/AuthContext";
import { TenantProvider } from "./context/TenantProvider";
import { SecurityProvider } from "./components/security/SecurityProvider";
import { Toaster } from "./components/ui/sonner";
import DevToolsPanel from "./components/devtools/DevToolsPanel";
import ErrorBoundary, { RouteErrorBoundary } from "./components/ErrorBoundary";
import { ROUTES } from "./utils/routes";
import ProtectedRoute from "./components/ProtectedRoute";
import { Loader2 } from "lucide-react";

// Core pages (loaded immediately)
import Index from "./pages/Index";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import NotFound from "./pages/NotFound";

// Lazy-loaded pages for better performance
const UnifiedDashboard = lazy(() => import("./components/dashboard/UnifiedDashboard"));
const Shifts = lazy(() => import("./pages/Shifts"));
const CreateShift = lazy(() => import("./pages/CreateShift"));
const ShiftDetails = lazy(() => import("./pages/ShiftDetails"));
const ForgotPassword = lazy(() => import("./pages/ForgotPassword"));
const ResetPassword = lazy(() => import("./pages/ResetPassword"));
const AccountSettings = lazy(() => import("./pages/AccountSettings"));
const Profile = lazy(() => import("./pages/Profile"));
const CompanyProfile = lazy(() => import("./pages/CompanyProfile"));
// Removed TimeTracking and TimeHistory - business model restructured
const Messages = lazy(() => import("./pages/Messages"));
const Certificates = lazy(() => import("./pages/Certificates"));
const VerifyCertificatePage = lazy(() => import("./pages/VerifyCertificatePage"));
const CertificatePaymentSuccess = lazy(() => import("./pages/CertificatePaymentSuccess"));

// Admin-only pages
const Promoters = lazy(() => import("./pages/Promoters"));
const Reports = lazy(() => import("./pages/Reports"));
const Revenue = lazy(() => import("./pages/Revenue"));
const DataPurge = lazy(() => import("./pages/DataPurge"));

// Business model restructured - removed Training, Credits, Subscription, Referrals

// Development-only pages (conditionally loaded)
const DebugSupabase = process.env.NODE_ENV === 'development' 
  ? lazy(() => import("./pages/DebugSupabase"))
  : null;

// Loading component
const PageLoader = () => (
  <div className="min-h-screen flex items-center justify-center">
    <div className="flex flex-col items-center gap-4">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
      <p className="text-sm text-muted-foreground">Loading...</p>
    </div>
  </div>
);

// Root component
function App() {
  return (
    <ErrorBoundary showDetails={process.env.NODE_ENV === 'development'}>
      <ErrorProvider>
        <SecurityProvider>
          <AuthProvider>
            <TenantProvider>
              <BrowserRouter>
                <Suspense fallback={<PageLoader />}>
                  <Routes>
                    {/* Public routes */}
                    <Route path={ROUTES.HOME} element={<Index />} />
                    <Route path={ROUTES.LOGIN} element={<Login />} />
                    <Route path={ROUTES.SIGNUP} element={<Signup />} />
                    <Route 
                      path={ROUTES.FORGOT_PASSWORD} 
                      element={
                        <RouteErrorBoundary routeName="Forgot Password">
                          <ForgotPassword />
                        </RouteErrorBoundary>
                      } 
                    />
                    <Route 
                      path={ROUTES.RESET_PASSWORD} 
                      element={
                        <RouteErrorBoundary routeName="Reset Password">
                          <ResetPassword />
                        </RouteErrorBoundary>
                      } 
                    />
                    <Route 
                      path={ROUTES.VERIFY_CERTIFICATE} 
                      element={
                        <RouteErrorBoundary routeName="Verify Certificate">
                          <VerifyCertificatePage />
                        </RouteErrorBoundary>
                      } 
                    />
                    <Route 
                      path={ROUTES.CERTIFICATE_PAYMENT_SUCCESS} 
                      element={
                        <RouteErrorBoundary routeName="Payment Success">
                          <CertificatePaymentSuccess />
                        </RouteErrorBoundary>
                      } 
                    />
                    <Route 
                      path={ROUTES.CERTIFICATE_PAYMENT_CANCELLED} 
                      element={
                        <RouteErrorBoundary routeName="Payment Cancelled">
                          <CertificatePaymentSuccess />
                        </RouteErrorBoundary>
                      } 
                    />
                    
                    {/* Development-only debug route - removed for streamlined business model */}
                    
                    {/* Protected routes */}
                    <Route element={<ProtectedRoute />}>
                      <Route 
                        path={ROUTES.DASHBOARD} 
                        element={
                          <RouteErrorBoundary routeName="Dashboard">
                            <UnifiedDashboard />
                          </RouteErrorBoundary>
                        } 
                      />
                      <Route 
                        path={ROUTES.COMPANY} 
                        element={
                          <RouteErrorBoundary routeName="Company Dashboard">
                            <UnifiedDashboard />
                          </RouteErrorBoundary>
                        } 
                      />
                      <Route 
                        path={ROUTES.COMPANY_PROFILE} 
                        element={
                          <RouteErrorBoundary routeName="Company Profile">
                            <CompanyProfile />
                          </RouteErrorBoundary>
                        } 
                      />
                      <Route 
                        path={ROUTES.SHIFTS} 
                        element={
                          <RouteErrorBoundary routeName="Shifts">
                            <Shifts />
                          </RouteErrorBoundary>
                        } 
                      />
                      <Route 
                        path={ROUTES.SHIFTS_CREATE} 
                        element={
                          <RouteErrorBoundary routeName="Create Shift">
                            <CreateShift />
                          </RouteErrorBoundary>
                        } 
                      />
                      <Route 
                        path={ROUTES.SHIFTS_DETAIL} 
                        element={
                          <RouteErrorBoundary routeName="Shift Details">
                            <ShiftDetails />
                          </RouteErrorBoundary>
                        } 
                      />
                      <Route 
                        path={ROUTES.PROFILE} 
                        element={
                          <RouteErrorBoundary routeName="Profile">
                            <Profile />
                          </RouteErrorBoundary>
                        } 
                      />
                      <Route 
                        path={ROUTES.SETTINGS} 
                        element={
                          <RouteErrorBoundary routeName="Settings">
                            <AccountSettings />
                          </RouteErrorBoundary>
                        } 
                      />
                      <Route 
                        path={ROUTES.MESSAGES} 
                        element={
                          <RouteErrorBoundary routeName="Messages">
                            <Messages />
                          </RouteErrorBoundary>
                        } 
                      />
                      <Route 
                        path={ROUTES.CERTIFICATES} 
                        element={
                          <RouteErrorBoundary routeName="Certificates">
                            <Certificates />
                          </RouteErrorBoundary>
                        } 
                      />
                      <Route 
                        path={ROUTES.CERTIFICATES_REQUEST} 
                        element={
                          <RouteErrorBoundary routeName="Request Certificate">
                            <Certificates />
                          </RouteErrorBoundary>
                        } 
                      />
                      
                      {/* Business model restructured - removed Time Tracking, Training, Credits, Subscription, Referrals */}
                      
                      {/* Admin routes */}
                      <Route 
                        path={ROUTES.PROMOTERS} 
                        element={
                          <RouteErrorBoundary routeName="Promoters">
                            <Promoters />
                          </RouteErrorBoundary>
                        } 
                      />
                      <Route 
                        path={ROUTES.REPORTS} 
                        element={
                          <RouteErrorBoundary routeName="Reports">
                            <Reports />
                          </RouteErrorBoundary>
                        } 
                      />
                      <Route 
                        path={ROUTES.REVENUE} 
                        element={
                          <RouteErrorBoundary routeName="Revenue">
                            <Revenue />
                          </RouteErrorBoundary>
                        } 
                      />
                      <Route 
                        path={ROUTES.DATA_PURGE} 
                        element={
                          <RouteErrorBoundary routeName="Data Management">
                            <DataPurge />
                          </RouteErrorBoundary>
                        } 
                      />
                    </Route>
                    
                    {/* Fallback route */}
                    <Route path={ROUTES.NOT_FOUND} element={<NotFound />} />
                  </Routes>
                </Suspense>
              </BrowserRouter>
              <Toaster richColors />
              {process.env.NODE_ENV === 'development' && <DevToolsPanel />}
            </TenantProvider>
          </AuthProvider>
        </SecurityProvider>
      </ErrorProvider>
    </ErrorBoundary>
  );
}

export default App;