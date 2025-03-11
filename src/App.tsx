
import { Routes, Route } from "react-router-dom";
import { Toaster } from "sonner";
import Index from "@/pages/Index";
import Login from "@/pages/Login";
import Signup from "@/pages/Signup";
import Dashboard from "@/pages/Dashboard";
import Shifts from "@/pages/Shifts";
import ShiftDetails from "@/pages/ShiftDetails";
import TimeTracking from "@/pages/TimeTracking";
import TimeHistory from "@/pages/TimeHistory";
import AccountSettings from "@/pages/AccountSettings";
import NotFound from "@/pages/NotFound";
import ProtectedRoute from "@/components/ProtectedRoute";
import ForgotPassword from "@/pages/ForgotPassword";
import ResetPassword from "@/pages/ResetPassword";
import { ToastContainer, useAppNotifications } from "@/components/feedback/ToastContainer";

function App() {
  // Initialize app-wide notifications
  useAppNotifications();
  
  return (
    <div className="App">
      <ToastContainer />
      <Routes>
        <Route path="/" element={<Index />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route element={<ProtectedRoute />}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/shifts" element={<Shifts />} />
          <Route path="/shifts/:id" element={<ShiftDetails />} />
          <Route path="/time-tracking" element={<TimeTracking />} />
          <Route path="/time-history" element={<TimeHistory />} />
          <Route path="/account-settings" element={<AccountSettings />} />
        </Route>
        <Route path="*" element={<NotFound />} />
      </Routes>
    </div>
  );
}

export default App;
