
import { Menu, Bell, User, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { NotificationBadge } from "@/components/notifications/NotificationBadge";
import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";

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

  return (
    <header className={cn(
      "h-16 border-b border-border bg-card/80 backdrop-blur-md sticky top-0 z-30",
      "flex items-center justify-between px-4 transition-all duration-300"
    )}>
      <div className="flex items-center">
        {!isMobile ? (
          <button 
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 rounded-md hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors"
            aria-label={sidebarOpen ? "Close sidebar" : "Open sidebar"}
          >
            <Menu size={20} />
          </button>
        ) : (
          <button 
            onClick={() => setSidebarOpen(true)}
            className="p-2 rounded-md hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors md:hidden"
            aria-label="Open sidebar"
          >
            <Menu size={20} />
          </button>
        )}
        <h1 className="ml-4 text-xl font-semibold">{title || "Dashboard"}</h1>
      </div>
      
      <div className="flex items-center gap-2">
        <div className="relative hidden md:flex items-center mr-2">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input 
            placeholder="Search..." 
            className="pl-9 h-9 w-64 bg-secondary/50" 
          />
        </div>
        
        <NotificationBadge count={3} />
        
        <Button 
          variant="ghost" 
          size="icon"
          className="rounded-full hover:bg-secondary"
          onClick={() => navigate("/profile")}
          aria-label="User profile"
        >
          <User size={20} />
        </Button>
      </div>
    </header>
  );
}
