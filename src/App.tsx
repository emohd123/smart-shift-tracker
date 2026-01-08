import { lazy, Suspense } from "react";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { ErrorProvider } from "./context/ErrorContext";
import { AuthProvider } from "./context/AuthContext";
import { SecurityProvider } from "./components/security/SecurityProvider";
import { Toaster } from "./components/ui/sonner";
import DevToolsPanel from "./components/devtools/DevToolsPanel";

// Eager load - Critical pages (public routes)
import Index from "./pages/Index";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import VerifyCertificatePage from "./pages/VerifyCertificatePage";
import NotFound from "./pages/NotFound";
import ProtectedRoute from "./components/ProtectedRoute";

// Lazy load - Role-specific dashboards (code split by role)
const Dashboard = lazy(() => import("./pages/Dashboard"));
const CompanyDashboard = lazy(() => import("./pages/CompanyDashboard"));

// Lazy load - Shifts (largest feature set)
const Shifts = lazy(() => import("./pages/Shifts"));
const CreateShift = lazy(() => import("./pages/CreateShift"));
const EditShift = lazy(() => import("./pages/EditShift"));
const ShiftDetails = lazy(() => import("./pages/ShiftDetails"));

// Lazy load - Other protected pages
const CompanyProfilePage = lazy(() => import("./pages/CompanyProfilePage"));
const PromoterContracts = lazy(() => import("./pages/PromoterContracts"));
const Promoters = lazy(() => import("./pages/Promoters"));
const TimeTracking = lazy(() => import("./pages/TimeTracking"));
const TimeHistory = lazy(() => import("./pages/TimeHistory"));
const Reports = lazy(() => import("./pages/Reports"));
const Messages = lazy(() => import("./pages/Messages"));
const DataPurge = lazy(() => import("./pages/DataPurge"));
const Profile = lazy(() => import("./pages/Profile"));
const Certificates = lazy(() => import("./pages/Certificates"));
const Revenue = lazy(() => import("./pages/Revenue"));

// Loading fallback component
const PageLoader = () => (
  <div className="flex items-center justify-center min-h-screen">
    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
  </div>
);

// Root component
function App() {
  return (
    <ErrorProvider>
      <SecurityProvider>
        <AuthProvider>
          <BrowserRouter>
            <Suspense fallback={<PageLoader />}>
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
                  <Route path="/company/profile" element={<CompanyProfilePage />} />
                  <Route path="/admin" element={<Dashboard />} />
                  <Route path="/shifts" element={<Shifts />} />
                  <Route path="/shifts/create" element={<CreateShift />} />
                  <Route path="/shifts/:id/edit" element={<EditShift />} />
                  <Route path="/shifts/:id" element={<ShiftDetails />} />
                  <Route path="/profile" element={<Profile />} />
                  <Route path="/settings" element={<Profile />} />
                  <Route path="/contracts" element={<PromoterContracts />} />
                  <Route path="/promoters" element={<Promoters />} />
                  <Route path="/time" element={<TimeTracking />} />
                  <Route path="/time-history" element={<TimeHistory />} />
                  <Route path="/reports" element={<Reports />} />
                  <Route path="/messages" element={<Messages />} />
                  <Route path="/data-purge" element={<DataPurge />} />
                  <Route path="/certificates" element={<Certificates />} />
                  <Route path="/revenue" element={<Revenue />} />
                </Route>
                
                {/* Fallback route */}
                <Route path="*" element={<NotFound />} />
              </Routes>
            </Suspense>
            <Toaster richColors />
            {import.meta.env.DEV && <DevToolsPanel />}
          </BrowserRouter>
        </AuthProvider>
      </SecurityProvider>
    </ErrorProvider>
  );
}

export default App;