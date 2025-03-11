
import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";

interface NavItem {
  label: string;
  icon: React.ReactNode;
  href: string;
}

interface NavigationLinksProps {
  navItems: NavItem[];
}

export function NavigationLinks({ navItems }: NavigationLinksProps) {
  const location = useLocation();
  
  return (
    <nav className="mt-4 px-3">
      <div className="space-y-1">
        {navItems.map((item) => {
          const isActive = location.pathname === item.href;
          
          return (
            <Link
              key={item.href}
              to={item.href}
              className={cn(
                "flex items-center h-10 px-3 py-2 text-sm rounded-md transition-colors group",
                isActive 
                  ? "bg-secondary text-foreground font-medium" 
                  : "hover:bg-secondary hover:text-foreground text-muted-foreground"
              )}
            >
              <span className={cn(
                "mr-3", 
                isActive ? "text-foreground" : "text-muted-foreground group-hover:text-foreground"
              )}>
                {item.icon}
              </span>
              {item.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
