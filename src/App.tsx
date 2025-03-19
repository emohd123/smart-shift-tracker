
import { lazy, Suspense } from "react";
import { Routes, Route, useLocation } from "react-router-dom";
import { Toaster } from "sonner";
import ProtectedRoute from "@/components/ProtectedRoute";
import { ToastContainer, useAppNotifications } from "@/components/feedback/ToastContainer";
import { Loader2 } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";

// Regular imports for frequently accessed pages
import Index from "@/pages/Index";
import Login from "@/pages/Login";
import NotFound from "@/pages/NotFound";

// Lazy loaded components for code splitting
const Signup = lazy(() => import("@/pages/Signup"));
const Dashboard = lazy(() => import("@/pages/Dashboard"));
const Shifts = lazy(() => import("@/pages/Shifts"));
const ShiftDetails = lazy(() => import("@/pages/ShiftDetails"));
const TimeTracking = lazy(() => import("@/pages/TimeTracking"));
const TimeHistory = lazy(() => import("@/pages/TimeHistory"));
const AccountSettings = lazy(() => import("@/pages/AccountSettings"));
const ForgotPassword = lazy(() => import("@/pages/ForgotPassword"));
const ResetPassword = lazy(() => import("@/pages/ResetPassword"));
const CreateShift = lazy(() => import("@/pages/CreateShift"));
const Certificates = lazy(() => import("@/pages/Certificates"));
const VerifyCertificatePage = lazy(() => import("@/pages/VerifyCertificatePage"));

// Loading fallback for lazy-loaded components
const PageLoader = () => (
  <div className="h-screen flex items-center justify-center bg-background">
    <div className="flex flex-col items-center">
      <div className="relative">
        <div className="h-16 w-16 rounded-full border-t-2 border-b-2 border-primary animate-spin"></div>
        <Loader2 className="h-8 w-8 text-primary absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2" />
      </div>
      <span className="mt-6 text-muted-foreground">Loading your experience...</span>
    </div>
  </div>
);

// Page transition variants
const pageVariants = {
  initial: {
    opacity: 0,
    y: 10,
  },
  in: {
    opacity: 1,
    y: 0,
  },
  out: {
    opacity: 0,
    y: -10,
  },
};

// Page transition settings
const pageTransition = {
  type: "tween",
  ease: "easeInOut",
  duration: 0.3,
};

function App() {
  // Initialize app-wide notifications
  useAppNotifications();
  const location = useLocation();
  
  return (
    <div className="App">
      <ToastContainer />
      <AnimatePresence mode="wait">
        <motion.div
          key={location.pathname}
          initial="initial"
          animate="in"
          exit="out"
          variants={pageVariants}
          transition={pageTransition}
          className="page-wrapper"
        >
          <Suspense fallback={<PageLoader />}>
            <Routes location={location}>
              <Route path="/" element={<Index />} />
              <Route path="/login" element={<Login />} />
              <Route path="/signup" element={<Signup />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />
              <Route path="/reset-password" element={<ResetPassword />} />
              
              {/* Protected routes that require authentication */}
              <Route element={<ProtectedRoute />}>
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/shifts" element={<Shifts />} />
                <Route path="/shifts/:id" element={<ShiftDetails />} />
                <Route path="/time-tracking" element={<TimeTracking />} />
                <Route path="/time-history" element={<TimeHistory />} />
                <Route path="/account-settings" element={<AccountSettings />} />
                <Route path="/certificates" element={<Certificates />} />
                <Route path="/create-shift" element={<CreateShift />} />
              </Route>
              
              {/* Public routes for certificate verification */}
              <Route path="/verify-certificate/:referenceNumber" element={<VerifyCertificatePage />} />
              
              {/* Catch-all route for 404 errors */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Suspense>
        </motion.div>
      </AnimatePresence>
      
      <Toaster 
        position="top-right"
        toastOptions={{
          duration: 5000,
          className: "toast-enhanced",
          style: {
            background: "var(--background)",
            color: "var(--foreground)",
            border: "1px solid var(--border)",
            borderRadius: "var(--radius)",
          },
        }}
      />
    </div>
  );
}

export default App;
