
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";
import { Badge } from "@/components/ui/badge";

export default function UnreadMessagesBadge() {
  const { user } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (!user) {
      setUnreadCount(0);
      return;
    }

    // Function to fetch unread messages count
    const fetchUnreadCount = async () => {
      try {
        const { count, error } = await supabase
          .from("messages")
          .select("*", { count: "exact", head: true })
          .eq("receiver_id", user.id)
          .eq("is_read", false);

        if (error) {
          console.error("Error fetching unread messages:", error);
          return;
        }

        setUnreadCount(count || 0);
      } catch (error) {
        console.error("Error in fetchUnreadCount:", error);
      }
    };

    // Initial fetch
    fetchUnreadCount();

    // Set up real-time subscription for new messages
    const subscription = supabase
      .channel('unread_messages_count')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'messages',
          filter: `receiver_id=eq.${user.id}`
        },
        () => {
          // Refresh unread count when any message changes
          fetchUnreadCount();
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [user]);

  if (unreadCount === 0) {
    return null;
  }

  return (
    <Badge variant="destructive" className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-[10px]">
      {unreadCount > 9 ? '9+' : unreadCount}
    </Badge>
  );
}
