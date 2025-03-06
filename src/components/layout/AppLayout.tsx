
import { ReactNode, useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { 
  ChevronLeft, 
  Menu,
  Calendar, 
  Clock, 
  Users, 
  Settings, 
  LogOut,
  User,
  Home,
  BarChart
} from "lucide-react";
import { cn } from "@/lib/utils";

type AppLayoutProps = {
  children: ReactNode;
  title?: string;
};

export default function AppLayout({ children, title }: AppLayoutProps) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [isMobile, setIsMobile] = useState(false);

  // Handle responsive behavior
  useEffect(() => {
    const checkSize = () => {
      const mobileView = window.innerWidth < 768;
      setIsMobile(mobileView);
      if (mobileView) {
        setSidebarOpen(false);
      }
    };
    
    checkSize();
    window.addEventListener("resize", checkSize);
    return () => window.removeEventListener("resize", checkSize);
  }, []);

  const handleLogout = () => {
    logout();
    navigate("/login");
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
    <div className="min-h-screen w-full flex bg-background">
      {/* Sidebar */}
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
        <nav className="mt-4 px-3">
          <div className="space-y-1">
            {navItems.map((item) => (
              <Link
                key={item.href}
                to={item.href}
                className="flex items-center h-10 px-3 py-2 text-sm rounded-md hover:bg-secondary hover:text-foreground transition-colors group"
              >
                <span className="mr-3 text-muted-foreground group-hover:text-foreground">
                  {item.icon}
                </span>
                {item.label}
              </Link>
            ))}
          </div>
        </nav>

        {/* User profile at bottom */}
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-border">
          <div className="flex items-center mb-3">
            <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center text-muted-foreground">
              <User size={18} />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium">{user?.name}</p>
              <p className="text-xs text-muted-foreground capitalize">{user?.role}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="flex w-full items-center justify-center h-9 px-3 py-2 text-sm rounded-md bg-secondary hover:bg-secondary/80 transition-colors"
          >
            <LogOut size={16} className="mr-2" />
            Logout
          </button>
        </div>
      </div>

      {/* Main content */}
      <div 
        className={cn(
          "flex-1 transition-all duration-300 ease-in-out",
          sidebarOpen ? "md:ml-64" : "ml-0"
        )}
      >
        {/* Header */}
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

        {/* Page content */}
        <main className="p-4 md:p-6 page-transition">
          {children}
        </main>
      </div>
    </div>
  );
}
