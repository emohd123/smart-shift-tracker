
import { Link } from "react-router-dom";
import { User as UserIcon, Settings, LogOut } from "lucide-react";
import { User } from "@/context/AuthContext";

interface UserProfileProps {
  user: User | null;
  onLogout: () => void;
}

export function UserProfile({ user, onLogout }: UserProfileProps) {
  return (
    <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-border">
      <div className="flex items-center mb-3">
        <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center text-muted-foreground">
          <UserIcon size={18} />
        </div>
        <div className="ml-3">
          <p className="text-sm font-medium">{user?.name}</p>
          <p className="text-xs text-muted-foreground capitalize">{user?.role}</p>
        </div>
      </div>
      <div className="flex space-x-2">
        <Link
          to="/account-settings"
          className="flex-1 flex items-center justify-center h-9 px-3 py-2 text-sm rounded-md bg-secondary hover:bg-secondary/80 transition-colors"
        >
          <Settings size={16} className="mr-2" />
          Account
        </Link>
        <button
          onClick={onLogout}
          className="flex-1 flex items-center justify-center h-9 px-3 py-2 text-sm rounded-md bg-secondary hover:bg-secondary/80 transition-colors"
        >
          <LogOut size={16} className="mr-2" />
          Logout
        </button>
      </div>
    </div>
  );
}
