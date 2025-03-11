
import { Menu } from "lucide-react";

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
  return (
    <header className="h-16 border-b border-border bg-card/80 backdrop-blur-md sticky top-0 z-30 flex items-center justify-between px-4">
      <div className="flex items-center">
        {!isMobile ? (
          <button 
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 rounded-md hover:bg-secondary text-muted-foreground"
          >
            <Menu size={20} />
          </button>
        ) : (
          <button 
            onClick={() => setSidebarOpen(true)}
            className="p-2 rounded-md hover:bg-secondary text-muted-foreground md:hidden"
          >
            <Menu size={20} />
          </button>
        )}
        <h1 className="ml-4 text-xl font-semibold">{title || "Dashboard"}</h1>
      </div>
    </header>
  );
}
