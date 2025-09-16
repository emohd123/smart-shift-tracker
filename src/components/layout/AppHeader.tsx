
import { Menu, Bell, User, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import NotificationBadge from "@/components/notifications/NotificationBadge";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { getProfileRoute } from "@/utils/routes";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

interface AppHeaderProps {
  title?: string;
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
  isMobile: boolean;
}

export function AppHeader({ 
  title, 
  sidebarOpen, 
  setSidebarOpen, 
  isMobile 
}: AppHeaderProps) {
  const navigate = useNavigate();
  const { user } = useAuth();

  return (
    <motion.header 
      className={cn(
        "h-16 border-b border-border bg-card/80 backdrop-blur-md sticky top-0 z-30",
        "flex items-center justify-between px-4 transition-all duration-300"
      )}
      initial={{ y: -10, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      <div className="flex items-center">
        {!isMobile ? (
          <motion.button 
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 rounded-md hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors"
            aria-label={sidebarOpen ? "Close sidebar" : "Open sidebar"}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Menu size={20} />
          </motion.button>
        ) : (
          <motion.button 
            onClick={() => setSidebarOpen(true)}
            className="p-2 rounded-md hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors md:hidden"
            aria-label="Open sidebar"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Menu size={20} />
          </motion.button>
        )}
        <h1 className="ml-4 text-xl font-semibold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
          {title || "Dashboard"}
        </h1>
      </div>
      
      <div className="flex items-center gap-2">
        <div className="relative hidden md:flex items-center mr-2">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input 
            placeholder="Search..." 
            className="pl-9 h-9 w-64 bg-secondary/50 focus:border-primary/30 transition-all duration-300" 
          />
        </div>
        
        <NotificationBadge />
        
        <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
          <Button 
            variant="ghost" 
            size="icon"
            className="rounded-full hover:bg-secondary"
            onClick={() => navigate(getProfileRoute(user?.role))}
            aria-label="User profile"
          >
            <User size={20} />
          </Button>
        </motion.div>
      </div>
    </motion.header>
  );
}
