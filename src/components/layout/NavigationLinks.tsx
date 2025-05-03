
import { NavLink } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { 
  CalendarDays, ChevronDown, 
  ClipboardList, Clock, Home, MessageCircle, 
  Settings, UserRound, Users, FileBarChart2, Eraser
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
  
  // Define if user is admin
  const isAdmin = user?.role === UserRole.Admin;

  return (
    <div className="flex flex-col gap-1">
      <AppLink to="/dashboard" icon={<Home className="h-4 w-4" />}>
        Dashboard
      </AppLink>
      
      <AppLink to="/shifts" icon={<CalendarDays className="h-4 w-4" />}>
        Shifts
      </AppLink>
      
      <AppLink to="/time" icon={<Clock className="h-4 w-4" />}>
        Time Tracking
      </AppLink>
      
      <AppLink to="/time-history" icon={<ClipboardList className="h-4 w-4" />}>
        Time History
      </AppLink>
      
      <AppLink to="/messages" icon={<MessageCircle className="h-4 w-4" />}>
        Messages
      </AppLink>
      
      {isAdmin && (
        <>
          <AppLink to="/promoters" icon={<Users className="h-4 w-4" />}>
            Promoters
          </AppLink>
          
          <AppLink to="/reports" icon={<FileBarChart2 className="h-4 w-4" />}>
            Reports
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
              <span>Settings</span>
            </div>
            <ChevronDown className="h-4 w-4" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-56" align="start">
          <DropdownMenuLabel>My Account</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem asChild>
            <NavLink to="/settings" className="flex w-full cursor-pointer">
              <UserRound className="mr-2 h-4 w-4" />
              <span>Profile</span>
            </NavLink>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
};
