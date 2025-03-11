
import { ReactNode, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { Menu } from "lucide-react";
import { cn } from "@/lib/utils";
import { AppSidebar } from "./AppSidebar";
import { AppHeader } from "./AppHeader";
import { useResponsive } from "@/hooks/useResponsive";

type AppLayoutProps = {
  children: ReactNode;
  title?: string;
};

export default function AppLayout({ children, title }: AppLayoutProps) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { isMobile } = useResponsive();
  const [sidebarOpen, setSidebarOpen] = useState(!isMobile);

  // Handle responsive behavior
  useEffect(() => {
    if (isMobile) {
      setSidebarOpen(false);
    } else {
      setSidebarOpen(true);
    }
  }, [isMobile]);

  return (
    <div className="min-h-screen w-full flex bg-background">
      <AppSidebar 
        user={user} 
        sidebarOpen={sidebarOpen} 
        setSidebarOpen={setSidebarOpen}
        isMobile={isMobile}
        navigate={navigate}
      />

      {/* Main content */}
      <div 
        className={cn(
          "flex-1 transition-all duration-300 ease-in-out",
          sidebarOpen ? "md:ml-64" : "ml-0"
        )}
      >
        <AppHeader 
          title={title} 
          sidebarOpen={sidebarOpen}
          setSidebarOpen={setSidebarOpen}
          isMobile={isMobile}
        />

        {/* Page content */}
        <main className="p-4 md:p-6 page-transition">
          {children}
        </main>
      </div>
    </div>
  );
}
