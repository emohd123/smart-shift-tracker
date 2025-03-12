
import { ReactNode, useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { Menu, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { AppSidebar } from "./AppSidebar";
import { AppHeader } from "./AppHeader";
import { useResponsive } from "@/hooks/useResponsive";
import { motion, AnimatePresence } from "framer-motion";
import { useError, ErrorSeverity } from "@/context/ErrorContext";

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
  const mainRef = useRef<HTMLDivElement>(null);
  const { addError } = useError();

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Toggle sidebar with Ctrl+B
      if (e.ctrlKey && e.key === 'b') {
        e.preventDefault();
        setSidebarOpen(prev => !prev);
      }
      
      // Navigate to dashboard with Ctrl+H
      if (e.ctrlKey && e.key === 'h') {
        e.preventDefault();
        navigate('/dashboard');
      }
      
      // Navigate to shifts with Ctrl+S
      if (e.ctrlKey && e.key === 's') {
        e.preventDefault();
        navigate('/shifts');
      }
      
      // Navigate to time tracking with Ctrl+T
      if (e.ctrlKey && e.key === 't') {
        e.preventDefault();
        navigate('/time-tracking');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [navigate]);

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

  // Focus management for accessibility
  useEffect(() => {
    if (!sidebarOpen && mainRef.current) {
      mainRef.current.focus();
    }
  }, [sidebarOpen]);

  // Test error system - remove in production
  const testErrorSystem = () => {
    try {
      throw new Error("This is a test error");
    } catch (error) {
      addError("Error system test", ErrorSeverity.WARNING, error);
    }
  };

  return (
    <div className="min-h-screen w-full flex flex-col md:flex-row bg-background overflow-hidden">
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div
            initial={{ x: isMobile ? -280 : 0, opacity: isMobile ? 0 : 1 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: isMobile ? -280 : 0, opacity: isMobile ? 0 : 1 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="fixed inset-0 z-50 md:relative"
          >
            <AppSidebar 
              user={user} 
              sidebarOpen={sidebarOpen} 
              setSidebarOpen={setSidebarOpen}
              isMobile={isMobile}
              navigate={navigate}
            />
            
            {/* Mobile overlay to close sidebar when clicking outside */}
            {isMobile && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
                className="fixed inset-0 bg-black/50 z-40 md:hidden"
                onClick={() => setSidebarOpen(false)}
                aria-hidden="true"
              />
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main content */}
      <motion.div 
        className={cn(
          "flex-1 flex flex-col transition-all duration-300 ease-in-out",
          "relative z-0",
          sidebarOpen ? "md:ml-64" : "ml-0",
        )}
        animate={{ 
          opacity: pageLoaded ? 1 : 0,
          y: pageLoaded ? 0 : 10
        }}
        initial={{ opacity: 0, y: 10 }}
        transition={{ duration: 0.5 }}
        ref={mainRef}
        tabIndex={-1}
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
      </motion.div>
    </div>
  );
}
