
import { NavLink } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { 
  CalendarDays, ChevronDown, 
  ClipboardList, Clock, Home, MessageCircle, 
  Settings, UserRound, Users, FileBarChart2, Eraser, Award, LayoutDashboard, DollarSign, FileText
} from "lucide-react";
import { UserRole } from "@/types/database";
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
  const AppLink = ({ to, children, icon, className = "" }) => (
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
  
  // Define if user is admin/company/promoter
  const isAdmin = user?.role === UserRole.Admin || user?.role === UserRole.SuperAdmin;
  const isCompany = user?.role === UserRole.Company;
  const isPromoter = user?.role === UserRole.Promoter;

  return (
    <div className="flex flex-col gap-1">
      {isCompany ? (
        <AppLink to="/company" icon={<Home className="h-4 w-4" />}>
          Dashboard
        </AppLink>
      ) : (
        <AppLink to="/dashboard" icon={<Home className="h-4 w-4" />}>
          Dashboard
        </AppLink>
      )}
      
      <AppLink to="/shifts" icon={<CalendarDays className="h-4 w-4" />}>
        Shifts
      </AppLink>
      
      {isCompany && (
        <AppLink to="/shifts/create" icon={<CalendarDays className="h-4 w-4" />}>
          Create Shift
        </AppLink>
      )}

      {isCompany && (
        <AppLink to="/company/contract" icon={<FileText className="h-4 w-4" />}>
          Contract Template
        </AppLink>
      )}
      
      {isPromoter && (
        <>
          <AppLink to="/time" icon={<Clock className="h-4 w-4" />}>
            Time Tracking
          </AppLink>
          
          <AppLink to="/time-history" icon={<ClipboardList className="h-4 w-4" />}>
            Time History
          </AppLink>
        </>
      )}
      
      <AppLink to="/messages" icon={<MessageCircle className="h-4 w-4" />}>
        Messages
      </AppLink>
      
      <AppLink to="/certificates" icon={<Award className="h-4 w-4" />}>
        Certificates
      </AppLink>
      
      {isAdmin && (
        <>
          <AppLink to="/admin" icon={<LayoutDashboard className="h-4 w-4" />}>
            Admin Dashboard
          </AppLink>
          
          <AppLink to="/promoters" icon={<Users className="h-4 w-4" />}>
            Promoters
          </AppLink>
          
          <AppLink to="/reports" icon={<FileBarChart2 className="h-4 w-4" />}>
            Reports
          </AppLink>
          
          <AppLink to="/revenue" icon={<DollarSign className="h-4 w-4" />}>
            Revenue
          </AppLink>
          
          <AppLink to="/data-purge" icon={<Eraser className="h-4 w-4" />}>
            Data Management
          </AppLink>
        </>
      )}
      
      {/* More options */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button className="flex items-center justify-between gap-2 rounded-md px-3 py-2 text-sm hover:bg-accent hover:text-accent-foreground transition-colors w-full">
            <div className="flex items-center gap-3">
              <Settings className="h-4 w-4" />
              <span>More</span>
            </div>
            <ChevronDown className="h-4 w-4" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-56" align="start">
          <DropdownMenuLabel>My Account</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem asChild>
            <NavLink to={isCompany ? "/company/profile" : "/profile"} className="flex w-full cursor-pointer">
              <UserRound className="mr-2 h-4 w-4" />
              <span>Profile & Settings</span>
            </NavLink>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
};
