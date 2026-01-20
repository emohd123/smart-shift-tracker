
import { useState, useEffect, useCallback } from "react";
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
            .or(`and(sender_id.eq.${currentUserId},recipient_id.eq.${contactId}),and(sender_id.eq.${contactId},recipient_id.eq.${currentUserId})`)
            .order("created_at", { ascending: false })
            .limit(1)
            .maybeSingle();

          if (error && error.code !== "PGRST116") {
            console.error("Error fetching last message:", error);
          }

          if (data) {
            setLastMessage(data);
          }
        } else {
          // Fetch full conversation - use proper PostgREST syntax
          const { data, error } = await supabase
            .from("messages")
            .select("*")
            .or(`and(sender_id.eq.${currentUserId},recipient_id.eq.${contactId}),and(sender_id.eq.${contactId},recipient_id.eq.${currentUserId})`)
            .order("created_at", { ascending: true });

          if (error) {
            console.error("Error fetching messages:", error);
            console.error("Error details:", JSON.stringify(error, null, 2));
            return;
          }

          console.log("Fetched messages:", data?.length || 0, "messages");
          setMessages(data || []);

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

    // Set up real-time subscription with better error handling
    const channelName = `messages:${currentUserId}:${contactId}`;
    const subscription = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'messages',
        },
        async (payload) => {
          console.log('Realtime event received:', payload.eventType, payload.new);
          
          // Handle different events
          if (payload.eventType === 'INSERT') {
            const newMessage = payload.new as Message;
            
            // Only process if message is part of this conversation
            const isRelevant = 
              (newMessage.sender_id === currentUserId && newMessage.recipient_id === contactId) ||
              (newMessage.sender_id === contactId && newMessage.recipient_id === currentUserId);

            if (!isRelevant) return;

            if (onlyLastMessage) {
              setLastMessage(newMessage);
            } else {
              // Check if message already exists to avoid duplicates
              setMessages(prev => {
                const exists = prev.some(msg => msg.id === newMessage.id);
                if (exists) return prev;
                return [...prev, newMessage];
              });

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
            
            const isRelevant = 
              (updatedMessage.sender_id === currentUserId && updatedMessage.recipient_id === contactId) ||
              (updatedMessage.sender_id === contactId && updatedMessage.recipient_id === currentUserId);

            if (!isRelevant) return;

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
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          console.log('Successfully subscribed to messages channel');
        } else if (status === 'CHANNEL_ERROR') {
          console.error('Error subscribing to messages channel');
        }
      });

    // Clean up subscription
    return () => {
      subscription.unsubscribe();
    };
  }, [currentUserId, contactId, onlyLastMessage]);

  // Expose a refresh function
  const refreshMessages = useCallback(async () => {
    if (!currentUserId || !contactId) return;
    
    setLoading(true);
    try {
      if (onlyLastMessage) {
        const { data, error } = await supabase
          .from("messages")
          .select("*")
          .or(`and(sender_id.eq.${currentUserId},recipient_id.eq.${contactId}),and(sender_id.eq.${contactId},recipient_id.eq.${currentUserId})`)
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle();

        if (error && error.code !== "PGRST116") {
          console.error("Error fetching last message:", error);
        }

        if (data) {
          setLastMessage(data);
        }
      } else {
        const { data, error } = await supabase
          .from("messages")
          .select("*")
          .or(`and(sender_id.eq.${currentUserId},recipient_id.eq.${contactId}),and(sender_id.eq.${contactId},recipient_id.eq.${currentUserId})`)
          .order("created_at", { ascending: true });

        if (error) {
          console.error("Error fetching messages:", error);
          console.error("Error details:", JSON.stringify(error, null, 2));
          return;
        }

        console.log("Refreshed messages:", data?.length || 0, "messages");
        setMessages(data || []);
      }
    } catch (error) {
      console.error("Error refreshing messages:", error);
    } finally {
      setLoading(false);
    }
  }, [currentUserId, contactId, onlyLastMessage]);

  return { messages, lastMessage, loading, refreshMessages };
};
