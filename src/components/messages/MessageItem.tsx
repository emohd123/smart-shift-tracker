
import { useState, useEffect } from "react";
import { Message } from "@/hooks/messages/types";
import { cn } from "@/lib/utils";
import { Check, CheckCheck } from "lucide-react";
import { formatMessageTime } from "@/hooks/messages/utils/messageUtils";

interface MessageItemProps {
  message: Message;
  isOwnMessage: boolean;
}

const MessageItem = ({ message, isOwnMessage }: MessageItemProps) => {
  const [timeAgo, setTimeAgo] = useState(formatMessageTime(message.created_at));

  // Update the time every minute
  useEffect(() => {
    const interval = setInterval(() => {
      setTimeAgo(formatMessageTime(message.created_at));
    }, 60000);
    
    return () => clearInterval(interval);
  }, [message.created_at]);

  return (
    <div
      className={cn(
        "flex items-end gap-2",
        isOwnMessage ? "justify-end" : "justify-start"
      )}
    >
      <div
        className={cn(
          "max-w-[80%] p-3 rounded-lg shadow-sm break-words",
          isOwnMessage
            ? "bg-primary text-primary-foreground rounded-br-none"
            : "bg-card border rounded-bl-none"
        )}
      >
        <p className="text-sm leading-relaxed whitespace-pre-wrap">{message.content}</p>
        <div className={cn(
          "text-[10px] flex items-center gap-1 mt-1",
          isOwnMessage ? "text-primary-foreground/70 justify-end" : "text-muted-foreground"
        )}>
          <span>{timeAgo}</span>
          {isOwnMessage && (
            message.read ? 
              <CheckCheck className="h-3 w-3" /> : 
              <Check className="h-3 w-3" />
          )}
        </div>
      </div>
    </div>
  );
};

export default MessageItem;
