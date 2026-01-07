import React, { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import { Bell, X, Check, AlertCircle, Info, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";
import { isMissingTableError } from "@/utils/supabaseErrors";

interface Notification {
  id: string;
  title: string;
  message: string;
  type: "info" | "success" | "warning" | "error";
  read: boolean;
  created_at: string;
  related_id?: string;
}

interface NotificationSystemProps {
  className?: string;
}

export const NotificationSystem: React.FC<NotificationSystemProps> = ({ className }) => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  const unreadCount = notifications.filter(n => !n.read).length;

  const fetchNotifications = useCallback(async () => {
    if (!user) return;

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) {
        if (isMissingTableError(error, 'notifications')) {
          // Table doesn't exist - this is OK, just return empty array
          setNotifications([]);
          return;
        }
        throw error;
      }
      setNotifications((data || []) as Notification[]);
    } catch (error) {
      if (!isMissingTableError(error, 'notifications')) {
        console.error('Error fetching notifications:', error);
        toast.error('Failed to load notifications');
      }
      setNotifications([]);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  // Set up real-time subscription (only if table exists)
  useEffect(() => {
    if (!user) return;
    
    // Check if notifications table exists before subscribing
    let subscription: ReturnType<typeof supabase.channel> | null = null;
    
    const setupSubscription = async () => {
      try {
        // Try a simple query to check if table exists
        const { error: testError } = await supabase
          .from('notifications')
          .select('id')
          .limit(1);
        
        // If table doesn't exist, don't subscribe
        if (isMissingTableError(testError, 'notifications')) {
          return;
        }
        
        // Table exists, set up subscription
        subscription = supabase
          .channel('notifications')
          .on(
            'postgres_changes',
            {
              event: 'INSERT',
              schema: 'public',
              table: 'notifications',
              filter: `user_id=eq.${user.id}`
            },
            (payload) => {
              const newNotification = payload.new as Notification;
              setNotifications(prev => [newNotification, ...prev]);
              
              // Show toast for new notification
              toast(newNotification.title, {
                description: newNotification.message,
                action: {
                  label: "View",
                  onClick: () => setIsOpen(true)
                }
              });
            }
          )
          .subscribe();
      } catch (error) {
        // Silently handle missing table
        if (!isMissingTableError(error, 'notifications')) {
          console.error('Error setting up notification subscription:', error);
        }
      }
    };
    
    setupSubscription();

    return () => {
      if (subscription) {
        supabase.removeChannel(subscription);
      }
    };
  }, [user]);

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
            prev.map(n => n.id === notificationId ? { ...n, read: true } : n)
          );
          return;
        }
        throw error;
      }

      setNotifications(prev =>
        prev.map(n => n.id === notificationId ? { ...n, read: true } : n)
      );
    } catch (error) {
      if (!isMissingTableError(error, 'notifications')) {
        console.error('Error marking notification as read:', error);
      }
    }
  };

  const markAllAsRead = async () => {
    if (!user) return;

    try {
      const unreadIds = notifications.filter(n => !n.read).map(n => n.id);
      if (unreadIds.length === 0) return;
      
      const { error } = await supabase
        .from('notifications')
        .update({ read: true })
        .in('id', unreadIds);

      if (error) {
        if (isMissingTableError(error, 'notifications')) {
          // Table doesn't exist - just update local state
          setNotifications(prev =>
            prev.map(n => ({ ...n, read: true }))
          );
          return;
        }
        throw error;
      }

      setNotifications(prev =>
        prev.map(n => ({ ...n, read: true }))
      );
    } catch (error) {
      if (!isMissingTableError(error, 'notifications')) {
        console.error('Error marking all notifications as read:', error);
      }
    }
  };

  const getNotificationIcon = (type: Notification['type']) => {
    switch (type) {
      case 'success':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'warning':
        return <AlertCircle className="h-4 w-4 text-yellow-500" />;
      case 'error':
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      default:
        return <Info className="h-4 w-4 text-blue-500" />;
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);

    if (diffInHours < 1) {
      return 'Just now';
    } else if (diffInHours < 24) {
      return `${Math.floor(diffInHours)}h ago`;
    } else {
      return date.toLocaleDateString();
    }
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="sm" className={`relative ${className}`}>
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge 
              variant="destructive" 
              className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center text-xs"
            >
              {unreadCount > 99 ? '99+' : unreadCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="end">
        <Card className="border-0 shadow-none">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-base font-medium">Notifications</CardTitle>
            <div className="flex items-center gap-2">
              {unreadCount > 0 && (
                <Button variant="ghost" size="sm" onClick={markAllAsRead}>
                  <Check className="h-4 w-4" />
                </Button>
              )}
              <Button variant="ghost" size="sm" onClick={() => setIsOpen(false)}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <ScrollArea className="h-[400px]">
              {loading ? (
                <div className="p-4 text-center text-muted-foreground">
                  Loading notifications...
                </div>
              ) : notifications.length === 0 ? (
                <div className="p-4 text-center text-muted-foreground">
                  No notifications yet
                </div>
              ) : (
                <div className="space-y-1">
                  {notifications.map((notification) => (
                    <div
                      key={notification.id}
                      className={`p-3 hover:bg-muted/50 cursor-pointer border-b last:border-b-0 ${
                        !notification.read ? 'bg-muted/30' : ''
                      }`}
                      onClick={() => markAsRead(notification.id)}
                    >
                      <div className="flex items-start gap-3">
                        {getNotificationIcon(notification.type)}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <p className={`text-sm font-medium truncate ${
                              !notification.read ? 'text-foreground' : 'text-muted-foreground'
                            }`}>
                              {notification.title}
                            </p>
                            {!notification.read && (
                              <div className="w-2 h-2 bg-primary rounded-full flex-shrink-0" />
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                            {notification.message}
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">
                            {formatDate(notification.created_at)}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </CardContent>
        </Card>
      </PopoverContent>
    </Popover>
  );
};

// Hook for sending notifications
export const useNotifications = () => {
  const { user } = useAuth();

  const sendNotification = useCallback(async (
    userId: string,
    title: string,
    message: string,
    type: Notification['type'] = 'info',
    relatedId?: string
  ) => {
    try {
      const { error } = await supabase
        .from('notifications')
        .insert({
          user_id: userId,
          title,
          message,
          type,
          related_id: relatedId
        });

      if (error) {
        if (isMissingTableError(error, 'notifications')) {
          // Table doesn't exist - silently fail (notifications feature not available)
          return false;
        }
        throw error;
      }
      return true;
    } catch (error) {
      if (!isMissingTableError(error, 'notifications')) {
        console.error('Error sending notification:', error);
      }
      return false;
    }
  }, []);

  const sendToCurrentUser = useCallback((
    title: string,
    message: string,
    type: Notification['type'] = 'info',
    relatedId?: string
  ) => {
    if (!user) return Promise.resolve(false);
    return sendNotification(user.id, title, message, type, relatedId);
  }, [user, sendNotification]);

  return {
    sendNotification,
    sendToCurrentUser
  };
};