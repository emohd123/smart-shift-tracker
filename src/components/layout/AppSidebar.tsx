
import { Link } from "react-router-dom";
import { ChevronLeft, Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import { NavigationLinks } from "./NavigationLinks";
import { User as UserType } from "@/context/AuthContext";
import UserProfile from "./UserProfile";
import { useAuth } from "@/context/AuthContext";
import UnreadMessagesBadge from "@/components/notifications/UnreadMessagesBadge";
import { TenantSwitcher } from "@/components/TenantSwitcher";
import { getDefaultDashboard } from "@/utils/routes";

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
  <Link to={getDefaultDashboard(user?.role)} className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-md bg-primary flex items-center justify-center">
            <Clock className="text-white" size={18} />
          </div>
          <span className="font-semibold text-lg">SmartShift</span>
        </Link>
        {isMobile && (
          <button 
            onClick={() => setSidebarOpen(false)}
            className="p-1 rounded-md hover:bg-secondary text-muted-foreground"
            aria-label="Close sidebar"
            title="Close sidebar"
          >
            <ChevronLeft size={20} />
          </button>
        )}
      </div>

      {/* Tenant Switcher */}
      <div className="px-4 py-3 border-b border-border">
        <TenantSwitcher />
      </div>

      {/* Nav Links */}
      <NavigationLinks />

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
