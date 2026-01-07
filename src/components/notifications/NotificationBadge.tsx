
import { useState, useEffect } from "react";
import { Bell } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";
import { useNavigate } from "react-router-dom";
import { formatDistanceToNow } from "date-fns";
import { isMissingTableError } from "@/utils/supabaseErrors";

// Define the notification type
interface Notification {
  id: string;
  title: string;
  message: string;
  read: boolean;
  type: string;
  related_id?: string;
  created_at: string;
}

export default function NotificationBadge() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  
  // Count unread notifications
  const unreadCount = notifications.filter(n => !n.read).length;
  
  // Fetch notifications when component mounts or user changes
  useEffect(() => {
    if (!user) return;
    
    let subscription: ReturnType<typeof supabase.channel> | null = null;
    
    const fetchNotifications = async () => {
      try {
        const { data, error } = await supabase
          .from('notifications')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(10);
        
        if (error) {
          // Check if table doesn't exist - this is OK, just return empty array
          if (isMissingTableError(error, 'notifications')) {
            setNotifications([]);
            return;
          }
          throw error;
        }
        
        if (data) {
          setNotifications(data as Notification[]);
          
          // Only subscribe to realtime updates if table exists
          subscription = supabase
            .channel('notifications-changes')
            .on('postgres_changes', 
              { 
                event: 'INSERT', 
                schema: 'public', 
                table: 'notifications',
                filter: `user_id=eq.${user.id}`
              }, 
              (payload) => {
                setNotifications(prev => [payload.new as Notification, ...prev].slice(0, 10));
              }
            )
            .subscribe();
        }
      } catch (error) {
        // Only log errors if table exists (not a missing table error)
        if (!isMissingTableError(error, 'notifications')) {
          console.error("Error fetching notifications:", error);
        }
        setNotifications([]);
      }
    };
    
    fetchNotifications();
    
    return () => {
      if (subscription) {
        subscription.unsubscribe();
      }
    };
  }, [user]);
  
  // Mark notification as read
  const markAsRead = async (notificationId: string) => {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ read: true })
        .eq('id', notificationId);
      
      if (error) {
        if (isMissingTableError(error, 'notifications')) {
          // Table doesn't exist - just update local state
          setNotifications(prev => 
            prev.map(notification => 
              notification.id === notificationId 
                ? { ...notification, read: true } 
                : notification
            )
          );
          return;
        }
        throw error;
      }
      
      setNotifications(prev => 
        prev.map(notification => 
          notification.id === notificationId 
            ? { ...notification, read: true } 
            : notification
        )
      );
    } catch (error) {
      if (!isMissingTableError(error, 'notifications')) {
        console.error("Error marking notification as read:", error);
      }
    }
  };
  
  // Mark all notifications as read
  const markAllAsRead = async () => {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ read: true })
        .eq('user_id', user?.id)
        .in('id', notifications.filter(n => !n.read).map(n => n.id));
      
      if (error) {
        if (isMissingTableError(error, 'notifications')) {
          // Table doesn't exist - just update local state
          setNotifications(prev => 
            prev.map(notification => ({ ...notification, read: true }))
          );
          return;
        }
        throw error;
      }
      
      setNotifications(prev => 
        prev.map(notification => ({ ...notification, read: true }))
      );
    } catch (error) {
      if (!isMissingTableError(error, 'notifications')) {
        console.error("Error marking all notifications as read:", error);
      }
    }
  };
  
  if (!user) return null;
  
  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge className="absolute -top-1 -right-1 h-5 min-w-5 flex items-center justify-center px-1 text-xs">
              {unreadCount}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80 max-h-[70vh] overflow-y-auto">
        <div className="flex justify-between items-center p-2 border-b">
          <span className="font-semibold">Notifications</span>
          {unreadCount > 0 && (
            <Button variant="ghost" size="sm" onClick={markAllAsRead}>
              Mark all as read
            </Button>
          )}
        </div>
        {notifications.length === 0 ? (
          <div className="p-4 text-center text-muted-foreground">
            No notifications
          </div>
        ) : (
          notifications.map((notification) => (
            <DropdownMenuItem
              key={notification.id}
              className={`p-3 cursor-pointer flex flex-col items-start gap-1 border-b ${
                !notification.read ? "bg-muted/50" : ""
              }`}
              onClick={() => {
                if (!notification.read) {
                  markAsRead(notification.id);
                }
                setIsOpen(false);
                
                // Navigate to contracts page for contract_required notifications
                if (notification.type === 'contract_required') {
                  const contractId = notification.related_id;
                  navigate(contractId ? `/contracts?contract=${contractId}` : '/contracts');
                }
              }}
            >
              <div className="flex w-full justify-between">
                <span className="font-medium">{notification.title}</span>
                <span className="text-xs text-muted-foreground">
                  {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
                </span>
              </div>
              <p className="text-sm text-muted-foreground">{notification.message}</p>
            </DropdownMenuItem>
          ))
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
