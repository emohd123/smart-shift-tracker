
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { Loader2 } from "lucide-react";
import { UserRole } from "@/types/database";

const ProtectedRoute = () => {
  const { isAuthenticated, loading, user } = useAuth();
  const location = useLocation();
  
  // Routes requiring admin only (companies excluded)
  const requiresAdmin = location.pathname.startsWith('/admin') || 
                       location.pathname === '/promoters' ||
                       location.pathname === '/reports' ||
                       location.pathname === '/revenue' ||
                       location.pathname === '/data-purge';

  // Routes accessible by company or admin
  const companyAccessRoute = location.pathname === '/shifts/create';

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
    return <Navigate to="/login" state={{ from: location }} replace />;
  }
  
  // If route requires admin but user is not admin
  if (requiresAdmin && user?.role !== UserRole.Admin) {
    return <Navigate to="/shifts" replace />;
  }

  // If route allows company or admin but user is neither
  if (companyAccessRoute && !(user?.role === UserRole.Admin || user?.role === UserRole.Company)) {
    return <Navigate to="/shifts" replace />;
  }

  // If authenticated, render the child routes
  return <Outlet />;
};

export default ProtectedRoute;
