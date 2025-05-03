
import { Link } from "react-router-dom";
import { ChevronLeft, Clock, Settings, LogOut, User, Home, Calendar, BarChart, Users, Award, MessageSquare, Clock4, History, UserCog } from "lucide-react";
import { cn } from "@/lib/utils";
import { NavigationLinks } from "./NavigationLinks";
import { User as UserType } from "@/context/AuthContext";
import UserProfile from "./UserProfile";
import { useAuth } from "@/context/AuthContext";
import UnreadMessagesBadge from "@/components/notifications/UnreadMessagesBadge";

interface AppSidebarProps {
  user: UserType | null;
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
  isMobile: boolean;
  navigate: (path: string) => void;
}

export function AppSidebar({ 
  user, 
  sidebarOpen, 
  setSidebarOpen, 
  isMobile,
  navigate
}: AppSidebarProps) {
  const { logout } = useAuth();
  
  const handleLogout = async () => {
    try {
      await logout();
      navigate("/login");
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  const adminNavItems = [
    { label: "Dashboard", icon: <Home size={20} />, href: "/dashboard" },
    { label: "Shifts", icon: <Calendar size={20} />, href: "/shifts" },
    { label: "Time Tracking", icon: <Clock size={20} />, href: "/time-tracking" },
    { label: "Time History", icon: <History size={20} />, href: "/time-history" },
    { label: "Promoters", icon: <Users size={20} />, href: "/promoters" },
    { 
      label: "Messages", 
      icon: (
        <div className="relative">
          <MessageSquare size={20} />
          <UnreadMessagesBadge />
        </div>
      ), 
      href: "/messages" 
    },
    { label: "Reports", icon: <BarChart size={20} />, href: "/reports", isNew: true },
    { label: "Certificates", icon: <Award size={20} />, href: "/certificates" },
    { label: "Create Shift", icon: <Calendar size={20} />, href: "/create-shift" },
    { label: "Account Settings", icon: <UserCog size={20} />, href: "/account-settings" },
  ];
  
  const userNavItems = [
    { label: "Dashboard", icon: <Home size={20} />, href: "/dashboard" },
    { label: "My Shifts", icon: <Calendar size={20} />, href: "/shifts" },
    { label: "Time Tracker", icon: <Clock size={20} />, href: "/time-tracking" },
    { label: "Time History", icon: <History size={20} />, href: "/time-history" },
    { 
      label: "Messages", 
      icon: (
        <div className="relative">
          <MessageSquare size={20} />
          <UnreadMessagesBadge />
        </div>
      ), 
      href: "/messages" 
    },
    { label: "Certificates", icon: <Award size={20} />, href: "/certificates" },
    { label: "Account Settings", icon: <UserCog size={20} />, href: "/account-settings" },
  ];

  const navItems = user?.role === "admin" ? adminNavItems : userNavItems;

  return (
    <div
      className={cn(
        "h-screen fixed inset-y-0 left-0 z-50 w-64 bg-card border-r border-border shadow-sm transition-transform duration-300 ease-in-out",
        sidebarOpen ? "translate-x-0" : "-translate-x-full",
        isMobile ? "md:translate-x-0" : ""
      )}
    >
      {/* Logo */}
      <div className="h-16 flex items-center justify-between px-4 border-b border-border">
        <Link to="/dashboard" className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-md bg-primary flex items-center justify-center">
            <Clock className="text-white" size={18} />
          </div>
          <span className="font-semibold text-lg">SmartShift</span>
        </Link>
        {isMobile && (
          <button 
            onClick={() => setSidebarOpen(false)}
            className="p-1 rounded-md hover:bg-secondary text-muted-foreground"
          >
            <ChevronLeft size={20} />
          </button>
        )}
      </div>

      {/* Nav Links */}
      <NavigationLinks navItems={navItems} />

      {/* User profile at bottom */}
      <div className="absolute bottom-0 left-0 w-full p-4 border-t border-border">
        <UserProfile 
          user={user} 
          onLogout={handleLogout} 
        />
      </div>
    </div>
  );
}
