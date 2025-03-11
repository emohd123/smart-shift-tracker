
import { Link } from "react-router-dom";

interface NavItem {
  label: string;
  icon: React.ReactNode;
  href: string;
}

interface NavigationLinksProps {
  navItems: NavItem[];
}

export function NavigationLinks({ navItems }: NavigationLinksProps) {
  return (
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
  );
}
