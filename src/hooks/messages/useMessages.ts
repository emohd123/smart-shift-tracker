
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Message } from "./types";
import { toast } from "sonner";

/**
 * Hook to fetch and listen to messages between two users
 */
export const useMessages = (
  currentUserId?: string,
  contactId?: string,
  onlyLastMessage: boolean = false
) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [lastMessage, setLastMessage] = useState<Message | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!currentUserId || !contactId) {
      setMessages([]);
      setLastMessage(null);
      setLoading(false);
      return;
    }

    // Reset state when changing conversation
    setMessages([]);
    setLastMessage(null);
    setLoading(true);

    // Function to load messages
    const loadMessages = async () => {
      try {
        // If we only need the last message
        if (onlyLastMessage) {
          const { data, error } = await supabase
            .from("messages")
            .select("*")
            .or(`sender_id.eq.${currentUserId},recipient_id.eq.${currentUserId}`)
            .or(`sender_id.eq.${contactId},recipient_id.eq.${contactId}`)
            .order("created_at", { ascending: false })
            .limit(1)
            .single();

          if (error && error.code !== "PGRST116") {
            console.error("Error fetching last message:", error);
          }

          if (data) {
            setLastMessage(data);
          }
        } else {
          // Fetch full conversation
          const { data, error } = await supabase
            .from("messages")
            .select("*")
            .or(
              `and(sender_id.eq.${currentUserId},recipient_id.eq.${contactId}),` +
              `and(sender_id.eq.${contactId},recipient_id.eq.${currentUserId})`
            )
            .order("created_at", { ascending: true });

          if (error) {
            console.error("Error fetching messages:", error);
            return;
          }

          setMessages(data);

          // Mark received messages as read
          if (data && data.length > 0) {
            const unreadMessages = data.filter(
              msg => msg.recipient_id === currentUserId && !msg.read
            );

            if (unreadMessages.length > 0) {
              const unreadIds = unreadMessages.map(msg => msg.id);

              // Update read status
              await supabase
                .from("messages")
                .update({ read: true })
                .in("id", unreadIds);
            }
          }
        }
      } catch (error) {
        console.error("Error in useMessages hook:", error);
      } finally {
        setLoading(false);
      }
    };

    // Load initial messages
    loadMessages();

    // Set up real-time subscription
    const subscription = supabase
      .channel('messages_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'messages',
          filter: `(sender_id=eq.${currentUserId} AND recipient_id=eq.${contactId}) OR (sender_id=eq.${contactId} AND recipient_id=eq.${currentUserId})`
        },
        async (payload) => {


          // Handle different events
          if (payload.eventType === 'INSERT') {
            const newMessage = payload.new as Message;

            if (onlyLastMessage) {
              setLastMessage(newMessage);
            } else {
              setMessages(prev => [...prev, newMessage]);

              // Mark as read if this is a received message
              if (newMessage.recipient_id === currentUserId && !newMessage.read) {
                await supabase
                  .from("messages")
                  .update({ read: true })
                  .eq("id", newMessage.id);
              }
            }
          } else if (payload.eventType === 'UPDATE') {
            const updatedMessage = payload.new as Message;

            if (onlyLastMessage) {
              if (lastMessage?.id === updatedMessage.id) {
                setLastMessage(updatedMessage);
              }
            } else {
              setMessages(prev =>
                prev.map(msg =>
                  msg.id === updatedMessage.id ? updatedMessage : msg
                )
              );
            }
          }
        }
      )
      .subscribe();

    // Clean up subscription
    return () => {
      subscription.unsubscribe();
    };
  }, [currentUserId, contactId, onlyLastMessage]);

  return { messages, lastMessage, loading };
};
