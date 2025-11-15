
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
        toast.error("Failed to send message");
        throw error;
      }

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
