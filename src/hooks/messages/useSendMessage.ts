
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { NewMessage } from "./types";
import { toast } from "sonner";

export const useSendMessage = () => {
  const [sending, setSending] = useState(false);

  const sendMessage = async (messageData: NewMessage) => {
    if (!messageData.content.trim()) {
      return;
    }

    setSending(true);

    try {
      console.log("Sending message:", {
        senderId: messageData.senderId,
        receiverId: messageData.receiverId,
        content: messageData.content.substring(0, 50) + "..."
      });

      const { data, error } = await supabase
        .from("messages")
        .insert({
          sender_id: messageData.senderId,
          recipient_id: messageData.receiverId,
          content: messageData.content,
        })
        .select()
        .single();

      if (error) {
        console.error("Error sending message:", error);
        console.error("Error details:", JSON.stringify(error, null, 2));
        
        // Provide more specific error messages
        let errorMessage = "Failed to send message";
        if (error.code === 'PGRST116' || error.code === '42P01') {
          errorMessage = "Messages feature is not available. Please contact support.";
        } else if (error.code === '42501') {
          errorMessage = "Permission denied. Please check your account permissions.";
        } else if (error.message) {
          errorMessage = error.message;
        }
        
        toast.error(errorMessage);
        throw new Error(errorMessage);
      }

      console.log("Message sent successfully:", data?.id);
      return data;
    } catch (error) {
      console.error("Error in sendMessage:", error);
      throw error;
    } finally {
      setSending(false);
    }
  };

  return { sendMessage, sending };
};
