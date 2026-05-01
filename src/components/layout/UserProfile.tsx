
import { useAuth } from "@/context/AuthContext";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuLabel, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { UserCircle, LogOut, HelpCircle } from "lucide-react";
import HelpGuide from "./HelpGuide";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import NotificationBadge from "../notifications/NotificationBadge";
import { User } from "@/context/AuthContext";

interface UserProfileProps {
  user?: User | null;
  onLogout?: () => Promise<void>;
}

export default function UserProfile({ user: propUser, onLogout: propLogout }: UserProfileProps = {}) {
  const { user: contextUser, logout: contextLogout } = useAuth();
  const navigate = useNavigate();
  const [helpOpen, setHelpOpen] = useState(false);
  
  // Use props if provided, otherwise fall back to context
  const user = propUser || contextUser;
  const logout = propLogout || contextLogout;
  
  const handleLogout = async () => {
    try {
      await logout();
      
      // Wait a moment for auth state to clear
      setTimeout(() => {
        navigate("/login", { replace: true });
      }, 100);
    } catch (error) {
      console.error("Logout error:", error);
      // Even if logout fails, redirect to login
      setTimeout(() => {
        navigate("/login", { replace: true });
      }, 100);
    }
  };
  
  if (!user) return null;
  
  const initials = user.email
    .split('@')[0]
    .substring(0, 2)
    .toUpperCase();
    
  return (
    <div className="flex items-center gap-2">
      <NotificationBadge />
      
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Avatar className="h-8 w-8 cursor-pointer">
            <AvatarImage src={user.metadata?.profile_photo_url || ""} alt={user.email} />
            <AvatarFallback className="bg-primary text-primary-foreground text-xs">
              {initials}
            </AvatarFallback>
          </Avatar>
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
          <DropdownMenuItem onClick={() => setHelpOpen(true)}>
            <HelpCircle className="mr-2 h-4 w-4" />
            Help & Guide
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={handleLogout}>
            <LogOut className="mr-2 h-4 w-4" />
            Logout
          </DropdownMenuItem>
        </DropdownMenuContent>
        <HelpGuide open={helpOpen} onOpenChange={setHelpOpen} />
      </DropdownMenu>
    </div>
  );
}
