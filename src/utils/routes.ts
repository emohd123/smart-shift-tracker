// Route Constants and Navigation Utilities
export const ROUTES = {
  // Public routes
  HOME: '/',
  LOGIN: '/login',
  SIGNUP: '/signup',
  FORGOT_PASSWORD: '/forgot-password',
  RESET_PASSWORD: '/reset-password',
  VERIFY_CERTIFICATE: '/verify-certificate',
  
  // Certificate payment routes
  CERTIFICATE_PAYMENT_SUCCESS: '/certificates/payment/success',
  CERTIFICATE_PAYMENT_CANCELLED: '/certificates/payment/cancelled',
  
  // Protected routes - Common
  DASHBOARD: '/dashboard',
  SHIFTS: '/shifts',
  SHIFTS_CREATE: '/shifts/create',
  SHIFTS_DETAIL: '/shifts/:id',
  PROFILE: '/profile',
  SETTINGS: '/settings',
  MESSAGES: '/messages',
  CERTIFICATES: '/certificates',
  CERTIFICATES_REQUEST: '/certificates/request',
  
  // Company routes
  COMPANY: '/company',
  COMPANY_PROFILE: '/company/profile',
  
  // Part-timer routes (minimal set)
  // Removed: TIME_TRACKING, TIME_HISTORY, TRAINING, CREDITS, SUBSCRIPTION, REFERRALS
  
  // Admin routes
  PROMOTERS: '/promoters',
  REPORTS: '/reports',
  REVENUE: '/revenue',
  DATA_PURGE: '/data-purge',
  
  // Fallback
  NOT_FOUND: '*'
} as const;

// Route groups for easier management
export const PUBLIC_ROUTES = [
  ROUTES.HOME,
  ROUTES.LOGIN,
  ROUTES.SIGNUP,
  ROUTES.FORGOT_PASSWORD,
  ROUTES.RESET_PASSWORD,
  ROUTES.VERIFY_CERTIFICATE,
  ROUTES.CERTIFICATE_PAYMENT_SUCCESS,
  ROUTES.CERTIFICATE_PAYMENT_CANCELLED
] as const;

export const ADMIN_ONLY_ROUTES = [
  ROUTES.PROMOTERS,
  ROUTES.REPORTS,
  ROUTES.REVENUE,
  ROUTES.DATA_PURGE
] as const;

export const COMPANY_ACCESS_ROUTES = [
  ROUTES.SHIFTS_CREATE,
  ROUTES.COMPANY,
  ROUTES.COMPANY_PROFILE
] as const;

export const PART_TIMER_ONLY_ROUTES = [
  // Removed all part-timer specific routes - they now use common routes
] as const;

// Role checking utilities
export const isAdminRole = (role: string | undefined): boolean => {
  return role === 'admin';
};

export const isCompanyRole = (role: string | undefined): boolean => {
  return role === 'company_admin' || role === 'company_manager' || role === 'company'; // Include legacy 'company' role
};

export const isPartTimerRole = (role: string | undefined): boolean => {
  return role === 'part_timer';
};

export const canAccessAdminRoutes = (role: string | undefined): boolean => {
  return isAdminRole(role);
};

export const canAccessCompanyRoutes = (role: string | undefined): boolean => {
  return isAdminRole(role) || isCompanyRole(role);
};

export const canAccessPartTimerRoutes = (role: string | undefined): boolean => {
  return isPartTimerRole(role);
};

// Route navigation helpers
export const getDefaultDashboard = (role: string | undefined): string => {
  if (isCompanyRole(role)) {
    return ROUTES.COMPANY;
  }
  return ROUTES.DASHBOARD;
};

export const getProfileRoute = (role: string | undefined): string => {
  if (isCompanyRole(role)) {
    return ROUTES.COMPANY_PROFILE;
  }
  return ROUTES.SETTINGS;
};

// Route validation
// Route validation utility
export const isValidRoute = (path: string): boolean => {
  const allRouteValues = Object.values(ROUTES) as string[];
  return allRouteValues.includes(path) || path.startsWith('/shifts/');
};

export const shouldRedirectToLogin = (path: string, isAuthenticated: boolean): boolean => {
  return !isAuthenticated && !PUBLIC_ROUTES.includes(path as (typeof PUBLIC_ROUTES)[number]);
};

export const getRedirectAfterLogin = (role: string | undefined): string => {
  return getDefaultDashboard(role);
};