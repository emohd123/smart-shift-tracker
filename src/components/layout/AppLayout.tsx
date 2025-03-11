
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
  const { isMobile, isTablet, windowWidth } = useResponsive();
  const [sidebarOpen, setSidebarOpen] = useState(!isMobile);
  const [pageLoaded, setPageLoaded] = useState(false);

  // Handle responsive behavior
  useEffect(() => {
    if (isMobile) {
      setSidebarOpen(false);
    } else {
      setSidebarOpen(true);
    }
  }, [isMobile]);

  // Add page load animation
  useEffect(() => {
    setPageLoaded(true);
  }, []);

  return (
    <div className="min-h-screen w-full flex flex-col md:flex-row bg-background overflow-hidden">
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
          "flex-1 flex flex-col transition-all duration-300 ease-in-out",
          sidebarOpen ? "md:ml-64" : "ml-0",
          pageLoaded ? "opacity-100" : "opacity-0",
        )}
      >
        <AppHeader 
          title={title} 
          sidebarOpen={sidebarOpen}
          setSidebarOpen={setSidebarOpen}
          isMobile={isMobile}
        />

        {/* Page content */}
        <main className={cn(
          "p-4 md:p-6 flex-1 overflow-auto",
          "animate-fade-in transition-all duration-300 ease-in-out"
        )}>
          <div className="container mx-auto max-w-7xl">
            {children}
          </div>
        </main>

        {/* Footer with subtle attribution - only on larger screens */}
        {!isMobile && (
          <footer className="py-3 px-6 border-t border-border/30 text-center text-xs text-muted-foreground">
            <p>SmartShift Tracker &copy; {new Date().getFullYear()} — All rights reserved</p>
          </footer>
        )}
      </div>
    </div>
  );
}
