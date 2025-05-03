
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { ErrorContextProvider } from "./context/ErrorContext";
import { AuthContextProvider } from "./context/AuthContext";
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
import ProtectedRoute from "./components/ProtectedRoute";

// Root component
function App() {
  return (
    <ErrorContextProvider>
      <AuthContextProvider>
        <BrowserRouter>
          <Routes>
            {/* Public routes */}
            <Route path="/" element={<Index />} />
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            
            {/* Protected routes */}
            <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
            <Route path="/shifts" element={<ProtectedRoute><Shifts /></ProtectedRoute>} />
            <Route path="/shifts/create" element={<ProtectedRoute adminOnly={true}><CreateShift /></ProtectedRoute>} />
            <Route path="/shifts/:id" element={<ProtectedRoute><ShiftDetails /></ProtectedRoute>} />
            <Route path="/settings" element={<ProtectedRoute><AccountSettings /></ProtectedRoute>} />
            <Route path="/promoters" element={<ProtectedRoute adminOnly={true}><Promoters /></ProtectedRoute>} />
            <Route path="/time" element={<ProtectedRoute><TimeTracking /></ProtectedRoute>} />
            <Route path="/time-history" element={<ProtectedRoute><TimeHistory /></ProtectedRoute>} />
            <Route path="/reports" element={<ProtectedRoute><Reports /></ProtectedRoute>} />
            <Route path="/messages" element={<ProtectedRoute><Messages /></ProtectedRoute>} />
            <Route path="/data-purge" element={<ProtectedRoute adminOnly={true}><DataPurge /></ProtectedRoute>} />
            
            {/* Fallback route */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
        <Toaster richColors />
      </AuthContextProvider>
    </ErrorContextProvider>
  );
}

export default App;
