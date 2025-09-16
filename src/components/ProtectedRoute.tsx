
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { Loader2 } from "lucide-react";
import { useContext } from "react";
import { TenantContext } from "@/hooks/useCurrentTenant";
import { 
  ROUTES,
  ADMIN_ONLY_ROUTES,
  COMPANY_ACCESS_ROUTES,
  PART_TIMER_ONLY_ROUTES,
  canAccessAdminRoutes,
  canAccessCompanyRoutes,
  canAccessPartTimerRoutes,
  getDefaultDashboard
} from "@/utils/routes";

const ProtectedRoute = () => {
  const { isAuthenticated, loading, user } = useAuth();
  const location = useLocation();
  const currentPath = location.pathname;
  const tenantCtx = useContext(TenantContext);
  const tenantRole = tenantCtx?.userRole || undefined;
  const effectiveRole = (user?.role as string | undefined) || tenantRole;

  // Check if current path requires specific permissions
  const requiresAdmin = ADMIN_ONLY_ROUTES.some(route => currentPath === route || currentPath.startsWith('/admin'));
  const requiresCompanyAccess = COMPANY_ACCESS_ROUTES.some(route => 
    currentPath === route || currentPath.startsWith('/company')
  );
  const requiresPartTimerAccess = PART_TIMER_ONLY_ROUTES.some(route => currentPath === route);

  // Show loading indicator while authentication state is being determined
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
    return <Navigate to={ROUTES.LOGIN} state={{ from: location }} replace />;
  }

  // Route permission checks with better fallbacks
  if (requiresAdmin && !canAccessAdminRoutes(effectiveRole)) {
    console.warn(`User with role ${user?.role} attempted to access admin route: ${currentPath}`);
    return <Navigate to={getDefaultDashboard(effectiveRole)} replace />;
  }

  if (requiresCompanyAccess && !canAccessCompanyRoutes(effectiveRole)) {
    console.warn(`User with role ${user?.role} attempted to access company route: ${currentPath}`);
    return <Navigate to={getDefaultDashboard(effectiveRole)} replace />;
  }

  if (requiresPartTimerAccess && !canAccessPartTimerRoutes(effectiveRole)) {
    console.warn(`User with role ${user?.role} attempted to access part-timer route: ${currentPath}`);
    return <Navigate to={getDefaultDashboard(effectiveRole)} replace />;
  }

  // Log successful route access for debugging
  console.debug(`User ${user?.email} (${effectiveRole}) accessing: ${currentPath}`);

  // If all checks pass, render the child routes
  return <Outlet />;
};

export default ProtectedRoute;
