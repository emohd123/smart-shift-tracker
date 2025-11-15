import { BrowserRouter, Route, Routes } from "react-router-dom";
import { ErrorProvider } from "./context/ErrorContext";
import { AuthProvider } from "./context/AuthContext";
import { SecurityProvider } from "./components/security/SecurityProvider";
import { Toaster } from "./components/ui/sonner";
import DevToolsPanel from "./components/devtools/DevToolsPanel";

// Pages
import Index from "./pages/Index";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Dashboard from "./pages/Dashboard";
import Shifts from "./pages/Shifts";
import CreateShift from "./pages/CreateShift";
import EditShift from "./pages/EditShift";
import ShiftDetails from "./pages/ShiftDetails";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import AccountSettings from "./pages/AccountSettings";
import Promoters from "./pages/Promoters";
import TimeTracking from "./pages/TimeTracking";
import TimeHistory from "./pages/TimeHistory";
import NotFound from "./pages/NotFound";
import Reports from "./pages/Reports";
import Messages from "./pages/Messages";
import DataPurge from "./pages/DataPurge";
import Profile from "./pages/Profile";
import Certificates from "./pages/Certificates";
import Revenue from "./pages/Revenue";
import VerifyCertificatePage from "./pages/VerifyCertificatePage";
import ProtectedRoute from "./components/ProtectedRoute";
import CompanyDashboard from "./pages/CompanyDashboard";
import CompanyProfile from "./pages/CompanyProfile";

// Root component
function App() {
  return (
    <ErrorProvider>
      <SecurityProvider>
        <AuthProvider>
          <BrowserRouter>
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
              <Route path="/shifts/:id/edit" element={<EditShift />} />
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
              <Route path="/revenue" element={<Revenue />} />
            </Route>
            
            {/* Fallback route */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
        <Toaster richColors />
      </AuthProvider>
      </SecurityProvider>
    </ErrorProvider>
  );
}

export default App;