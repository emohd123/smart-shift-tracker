
import { NavLink } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { 
  CalendarDays, ChevronDown, 
  Home, MessageCircle, 
  Settings, UserRound, Users, FileBarChart2, Eraser, Award, Coins
} from "lucide-react";
import { 
  ROUTES, 
  isAdminRole, 
  isCompanyRole, 
  isPartTimerRole, 
  getProfileRoute, 
  getDefaultDashboard 
} from "@/utils/routes";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export const NavigationLinks = () => {
  const { user } = useAuth();
  
  // Custom link component to handle active styles
  const AppLink = ({ to, children, icon, className = "" }: {
    to: string;
    children: React.ReactNode;
    icon: React.ReactNode;
    className?: string;
  }) => (
    <NavLink 
      to={to}
      className={({ isActive }) => `
        flex items-center gap-3 rounded-md px-3 py-2 text-sm 
        ${isActive 
          ? "bg-accent text-accent-foreground" 
          : "transparent hover:bg-accent hover:text-accent-foreground"} 
        transition-colors
        ${className}
      `}
    >
      {icon}
      <span>{children}</span>
    </NavLink>
  );
  
  // Use utility functions for role checking
  const isAdmin = isAdminRole(user?.role);
  const isCompany = isCompanyRole(user?.role);
  const isPromoter = isPartTimerRole(user?.role);

  return (
    <div className="flex flex-col gap-1">
      {/* Dashboard - Show appropriate dashboard based on role */}
      <AppLink 
        to={getDefaultDashboard(user?.role)} 
        icon={<Home className="h-4 w-4" />}
      >
        Dashboard
      </AppLink>
      
      {/* Shifts - Available to all authenticated users */}
      <AppLink to={ROUTES.SHIFTS} icon={<CalendarDays className="h-4 w-4" />}>
        Shifts
      </AppLink>
      
      {/* Create Shift - Company and Admin only */}
      {isCompany && (
        <AppLink to={ROUTES.SHIFTS_CREATE} icon={<CalendarDays className="h-4 w-4" />}>
          Create Shift
        </AppLink>
      )}
      
      {/* Time Tracking and Training features removed - focusing on shift management and certificate generation */}
      
      {/* Messages - Available to all */}
      <AppLink to={ROUTES.MESSAGES} icon={<MessageCircle className="h-4 w-4" />}>
        Messages
      </AppLink>
      
      {/* Certificates - Available to all */}
      <AppLink to={ROUTES.CERTIFICATES} icon={<Award className="h-4 w-4" />}>
        Certificates
      </AppLink>
      
      {/* Business model restructured - removed Training, Credits, Subscription, Referrals */}
      
      {/* Admin only features */}
      {isAdmin && (
        <>
          <AppLink to={ROUTES.PROMOTERS} icon={<Users className="h-4 w-4" />}>
            Promoters
          </AppLink>
          
          <AppLink to={ROUTES.REPORTS} icon={<FileBarChart2 className="h-4 w-4" />}>
            Reports
          </AppLink>
          
          <AppLink to={ROUTES.REVENUE} icon={<Coins className="h-4 w-4" />}>
            Revenue
          </AppLink>
          
          <AppLink to={ROUTES.DATA_PURGE} icon={<Eraser className="h-4 w-4" />}>
            Data Management
          </AppLink>
        </>
      )}
      
      {/* Settings dropdown */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button className="flex items-center justify-between gap-2 rounded-md px-3 py-2 text-sm hover:bg-accent hover:text-accent-foreground transition-colors w-full">
            <div className="flex items-center gap-3">
              <Settings className="h-4 w-4" />
              <span>Settings</span>
            </div>
            <ChevronDown className="h-4 w-4" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-56" align="start">
          <DropdownMenuLabel>My Account</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem asChild>
            <NavLink to={getProfileRoute(user?.role)} className="flex w-full cursor-pointer">
              <UserRound className="mr-2 h-4 w-4" />
              <span>Profile</span>
            </NavLink>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
};
