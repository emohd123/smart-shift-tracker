
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { Loader2 } from "lucide-react";

const ProtectedRoute = () => {
  const { isAuthenticated, loading, user } = useAuth();
  const location = useLocation();
  
  // Check if the route is admin-only
  const isAdminRoute = location.pathname.startsWith('/admin') || 
                       location.pathname === '/dashboard' ||
                       location.pathname === '/promoters' ||
                       location.pathname === '/reports';

  // Show a loading indicator while authentication state is being determined
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2 text-lg text-muted-foreground">Authenticating...</span>
      </div>
    );
  }

  // If not authenticated, redirect to login page
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  
  // Special check for the admin email
  const isAdminEmail = user?.email?.toLowerCase() === 'emohd123@gmail.com';
  
  // If it's an admin route but user is not an admin email, redirect to user dashboard
  if (isAdminRoute && !isAdminEmail) {
    return <Navigate to="/shifts" replace />;
  }

  // If authenticated, render the child routes
  return <Outlet />;
};

export default ProtectedRoute;
