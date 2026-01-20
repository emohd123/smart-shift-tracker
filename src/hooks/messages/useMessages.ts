
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
  const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'disconnected' | 'error'>('connecting');

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

    // Set up real-time subscription with enhanced error handling and retry logic
    const channelName = `messages:${currentUserId}:${contactId}`;
    let subscription: ReturnType<typeof supabase.channel>;
    let retryTimeout: ReturnType<typeof setTimeout>;
    let healthCheckInterval: ReturnType<typeof setInterval>;
    let retryCount = 0;
    const MAX_RETRIES = 5;
    const RETRY_DELAY = 2000; // 2 seconds

    const setupSubscription = () => {
      // Clean up existing subscription if any
      if (subscription) {
        subscription.unsubscribe();
      }

      setConnectionStatus('connecting');
      
      subscription = supabase
        .channel(channelName)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'messages',
          },
          async (payload) => {
            console.log('🔔 Realtime event received:', payload.eventType, payload.new);
            
            // Handle different events
            if (payload.eventType === 'INSERT') {
              const newMessage = payload.new as Message;
              
              // Only process if message is part of this conversation
              const isRelevant = 
                (newMessage.sender_id === currentUserId && newMessage.recipient_id === contactId) ||
                (newMessage.sender_id === contactId && newMessage.recipient_id === currentUserId);

              if (!isRelevant) {
                console.log('⏭️ Message filtered out (not relevant to this conversation)');
                return;
              }

              if (onlyLastMessage) {
                setLastMessage(newMessage);
              } else {
                // Check if message already exists to avoid duplicates
                setMessages(prev => {
                  const exists = prev.some(msg => msg.id === newMessage.id);
                  if (exists) {
                    console.log('⚠️ Duplicate message detected, skipping');
                    return prev;
                  }
                  console.log('✅ New message added via real-time');
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
          console.log(`📡 Subscription status: ${status}`);
          
          switch (status) {
            case 'SUBSCRIBED':
              console.log('✅ Successfully subscribed to messages channel via WebSocket');
              setConnectionStatus('connected');
              retryCount = 0; // Reset retry count on successful subscription
              break;
            case 'TIMED_OUT':
              console.warn('⏱️ Subscription timed out, retrying...');
              setConnectionStatus('disconnected');
              if (retryCount < MAX_RETRIES) {
                retryCount++;
                retryTimeout = setTimeout(() => {
                  console.log(`🔄 Retry attempt ${retryCount}/${MAX_RETRIES}`);
                  setupSubscription();
                }, RETRY_DELAY);
              } else {
                console.error('❌ Max retries reached for subscription');
                setConnectionStatus('error');
              }
              break;
            case 'CLOSED':
              console.warn('🔌 Subscription closed');
              setConnectionStatus('disconnected');
              // Attempt to reconnect
              if (retryCount < MAX_RETRIES) {
                retryCount++;
                retryTimeout = setTimeout(() => {
                  console.log(`🔄 Reconnecting... (attempt ${retryCount}/${MAX_RETRIES})`);
                  setupSubscription();
                }, RETRY_DELAY);
              }
              break;
            case 'CHANNEL_ERROR':
              console.error('❌ Error subscribing to messages channel');
              setConnectionStatus('error');
              if (retryCount < MAX_RETRIES) {
                retryCount++;
                retryTimeout = setTimeout(() => {
                  console.log(`🔄 Retrying after error... (attempt ${retryCount}/${MAX_RETRIES})`);
                  setupSubscription();
                }, RETRY_DELAY);
              }
              break;
            default:
              console.log(`ℹ️ Unknown subscription status: ${status}`);
          }
        });

      // Log WebSocket connection info and verify connection
      if (import.meta.env.DEV) {
        const realtime = supabase.realtime;
        if (realtime) {
          const isConnected = realtime.isConnected();
          const channelCount = realtime.channels?.length || 0;
          
          console.log('🔌 WebSocket connection info:', {
            isConnected: isConnected,
            channels: channelCount,
            channelName: channelName,
            transport: realtime.connectionState || 'unknown'
          });

          // Verify WebSocket is being used (not polling fallback)
          if (isConnected) {
            console.log('✅ WebSocket connection verified - using real-time transport');
          } else {
            console.warn('⚠️ WebSocket connection not established - may fall back to polling');
          }
        }
      }
    };

    // Add periodic connection health check
    healthCheckInterval = setInterval(() => {
      if (!currentUserId || !contactId) return;
      
      const realtime = supabase.realtime;
      if (realtime) {
        const isConnected = realtime.isConnected();
        const hasActiveChannels = realtime.channels && realtime.channels.length > 0;
        
        if (!isConnected && hasActiveChannels) {
          console.warn('⚠️ Health check: WebSocket disconnected but channels exist, attempting reconnection');
          setConnectionStatus('disconnected');
          // Trigger reconnection
          if (subscription && subscription.state !== 'joined') {
            setupSubscription();
          }
        } else if (isConnected && subscription && subscription.state === 'joined') {
          setConnectionStatus('connected');
        }
      }
    }, 10000); // Check every 10 seconds

    // Initial subscription setup
    setupSubscription();

    // Clean up subscription, retry timeout, and health check interval
    return () => {
      if (retryTimeout) {
        clearTimeout(retryTimeout);
      }
      if (healthCheckInterval) {
        clearInterval(healthCheckInterval);
      }
      if (subscription) {
        subscription.unsubscribe();
        console.log('🧹 Cleaned up subscription and health checks');
      }
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

  return { messages, lastMessage, loading, refreshMessages, connectionStatus };
};
