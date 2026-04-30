import { Menu, Bell, Search, UserCircle, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import NotificationBadge from "@/components/notifications/NotificationBadge";
import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { User } from "@/context/AuthContext";
import { useAuth } from "@/context/AuthContext";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface AppHeaderProps {
  title?: string;
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
  isMobile: boolean;
  user?: User | null;
}

export function AppHeader({ 
  title, 
  sidebarOpen, 
  setSidebarOpen, 
  isMobile,
  user
}: AppHeaderProps) {
  const navigate = useNavigate();
  const { logout } = useAuth();

  const handleLogout = async () => {
    try {
      await logout();
      setTimeout(() => navigate("/login", { replace: true }), 100);
    } catch (error) {
      console.error("Logout error:", error);
      navigate("/login", { replace: true });
    }
  };

  const initials = user?.email
    ? user.email.split('@')[0].substring(0, 2).toUpperCase()
    : '??';

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

        {user && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button 
                variant="ghost" 
                size="icon"
                className="rounded-full h-8 w-8 bg-primary text-primary-foreground text-xs font-semibold hover:bg-primary/90"
              >
                {initials}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium leading-none">{user.email}</p>
                  <p className="text-xs leading-none text-muted-foreground capitalize">
                    {user.role}
                  </p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => navigate("/profile")}>
                <UserCircle className="mr-2 h-4 w-4" />
                Profile & Settings
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleLogout}>
                <LogOut className="mr-2 h-4 w-4" />
                Logout
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>
    </motion.header>
  );
}