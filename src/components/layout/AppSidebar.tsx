
import { Link } from "react-router-dom";
import { ChevronLeft, Clock, Settings, LogOut, User, Home, Calendar, BarChart, Users } from "lucide-react";
import { cn } from "@/lib/utils";
import { NavigationLinks } from "./NavigationLinks";
import { User as UserType } from "@/context/AuthContext";
import UserProfile from "./UserProfile";
import { useAuth } from "@/context/AuthContext";

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

  const navItems = user?.role === "admin" 
    ? [
        { label: "Dashboard", icon: <Home size={20} />, href: "/dashboard" },
        { label: "Shifts", icon: <Calendar size={20} />, href: "/shifts" },
        { label: "Time Tracking", icon: <Clock size={20} />, href: "/time-tracking" },
        { label: "Promoters", icon: <Users size={20} />, href: "/promoters" },
        { label: "Reports", icon: <BarChart size={20} />, href: "/reports" },
        { label: "Settings", icon: <Settings size={20} />, href: "/settings" },
      ]
    : [
        { label: "Dashboard", icon: <Home size={20} />, href: "/dashboard" },
        { label: "My Shifts", icon: <Calendar size={20} />, href: "/shifts" },
        { label: "Time Tracker", icon: <Clock size={20} />, href: "/time-tracking" },
      ];

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

      {/* User profile at bottom - now pass the user and onLogout props correctly */}
      <div className="absolute bottom-0 left-0 w-full p-4 border-t border-border">
        <UserProfile 
          user={user} 
          onLogout={handleLogout} 
        />
      </div>
    </div>
  );
}
