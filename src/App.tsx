
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { ErrorProvider } from "./context/ErrorContext";
import { AuthProvider } from "./context/AuthContext";
import { Toaster } from "./components/ui/sonner";

// Pages
import Index from "./pages/Index";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Dashboard from "./pages/Dashboard";
import Shifts from "./pages/Shifts";
import CreateShift from "./pages/CreateShift";
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
import ProtectedRoute from "./components/ProtectedRoute";

// Root component
function App() {
  return (
    <ErrorProvider>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            {/* Public routes */}
            <Route path="/" element={<Index />} />
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            
            {/* Protected routes */}
            <Route element={<ProtectedRoute />}>
              <Route path="/dashboard" element={<Dashboard />} />
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
            </Route>
            
            {/* Fallback route */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
        <Toaster richColors />
      </AuthProvider>
    </ErrorProvider>
  );
}

export default App;
