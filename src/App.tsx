import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Suspense, lazy } from "react";
import { ErrorProvider } from "./context/ErrorContext";
import { AuthProvider } from "./context/AuthContext";
import { SecurityProvider } from "./components/security/SecurityProvider";
import { Toaster } from "./components/ui/sonner";
import DevToolsPanel from "./components/devtools/DevToolsPanel";
import ProtectedRoute from "./components/ProtectedRoute";
import ErrorBoundary from "./components/ErrorBoundary";
import LoadingSpinner from "./components/ui/LoadingSpinner";

// Lazy load components for better performance
const Index = lazy(() => import("./pages/Index"));
const Login = lazy(() => import("./pages/Login"));
const Signup = lazy(() => import("./pages/Signup"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const Shifts = lazy(() => import("./pages/Shifts"));
const CreateShift = lazy(() => import("./pages/CreateShift"));
const ShiftDetails = lazy(() => import("./pages/ShiftDetails"));
const ForgotPassword = lazy(() => import("./pages/ForgotPassword"));
const ResetPassword = lazy(() => import("./pages/ResetPassword"));
const AccountSettings = lazy(() => import("./pages/AccountSettings"));
const Promoters = lazy(() => import("./pages/Promoters"));
const TimeTracking = lazy(() => import("./pages/TimeTracking"));
const TimeHistory = lazy(() => import("./pages/TimeHistory"));
const NotFound = lazy(() => import("./pages/NotFound"));
const Reports = lazy(() => import("./pages/Reports"));
const Messages = lazy(() => import("./pages/Messages"));
const DataPurge = lazy(() => import("./pages/DataPurge"));
const Profile = lazy(() => import("./pages/Profile"));
const Certificates = lazy(() => import("./pages/Certificates"));
const Subscription = lazy(() => import("./pages/Subscription"));
const Revenue = lazy(() => import("./pages/Revenue"));
const Credits = lazy(() => import("./pages/Credits"));
const Training = lazy(() => import("./pages/Training"));
const Referrals = lazy(() => import("./pages/Referrals"));
const VerifyCertificatePage = lazy(() => import("./pages/VerifyCertificatePage"));
const CompanyDashboard = lazy(() => import("./pages/CompanyDashboard"));
const CompanyProfile = lazy(() => import("./pages/CompanyProfile"));

// Loading component
const LoadingFallback = () => (
  <div className="flex items-center justify-center min-h-screen">
    <LoadingSpinner size="xl" />
  </div>
);

// Root component
function App() {
  return (
    <ErrorBoundary>
      <ErrorProvider>
        <SecurityProvider>
          <AuthProvider>
            <BrowserRouter>
              <Suspense fallback={<LoadingFallback />}>
                <Routes>
                  {/* Public routes */}
                  <Route path="/" element={<Index />} />
                  <Route path="/login" element={<Login />} />
                  <Route path="/signup" element={<Signup />} />
                  <Route path="/forgot-password" element={<ForgotPassword />} />
                  <Route path="/reset-password" element={<ResetPassword />} />
                  <Route path="/verify-certificate" element={<VerifyCertificatePage />} />
                  
                  {/* Protected routes */}
                  <Route element={<ProtectedRoute />}>
                    <Route path="/dashboard" element={<Dashboard />} />
                    <Route path="/company" element={<CompanyDashboard />} />
                    <Route path="/company/profile" element={<CompanyProfile />} />
                    <Route path="/shifts" element={<Shifts />} />
                    <Route path="/shifts/create" element={<CreateShift />} />
                    <Route path="/shifts/:id" element={<ShiftDetails />} />
                    <Route path="/profile" element={<Profile />} />
                    <Route path="/settings" element={<AccountSettings />} />
                    <Route path="/promoters" element={<Promoters />} />
                    <Route path="/time" element={<TimeTracking />} />
                    <Route path="/time-history" element={<TimeHistory />} />
                    <Route path="/reports" element={<Reports />} />
                    <Route path="/messages" element={<Messages />} />
                    <Route path="/data-purge" element={<DataPurge />} />
                    <Route path="/certificates" element={<Certificates />} />
                    <Route path="/subscription" element={<Subscription />} />
                    <Route path="/revenue" element={<Revenue />} />
                    
                    <Route path="/credits" element={<Credits />} />
                    <Route path="/training" element={<Training />} />
                    <Route path="/referrals" element={<Referrals />} />
                  </Route>
                  
                  {/* Fallback route */}
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </Suspense>
            </BrowserRouter>
            <Toaster richColors />
          </AuthProvider>
        </SecurityProvider>
      </ErrorProvider>
    </ErrorBoundary>
  );
}

export default App;