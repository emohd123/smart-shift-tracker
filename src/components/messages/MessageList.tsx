
import { useEffect, useRef } from "react";
import { Message } from "@/hooks/messages/types";
import MessageItem from "./MessageItem";
import { formatMessageDate } from "@/hooks/messages/utils/messageUtils";

interface MessageListProps {
  messages: Message[];
  currentUserId: string;
}

const MessageList = ({ messages, currentUserId }: MessageListProps) => {
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Scroll to the bottom when messages update
    if (listRef.current) {
      listRef.current.scrollTop = listRef.current.scrollHeight;
    }
  }, [messages]);

  // Group messages by date for displaying date separators
  const groupedMessages = messages.reduce((groups, message) => {
    const date = formatMessageDate(message.created_at);
    if (!groups[date]) {
      groups[date] = [];
    }
    groups[date].push(message);
    return groups;
  }, {} as Record<string, Message[]>);

  return (
    <div ref={listRef} className="flex-1 overflow-y-auto space-y-4">
      {Object.entries(groupedMessages).map(([date, dateMessages]) => (
        <div key={date} className="space-y-2">
          <div className="text-center">
            <span className="text-xs bg-muted px-2 py-1 rounded-full text-muted-foreground">
              {date}
            </span>
          </div>
          {dateMessages.map((message) => (
            <MessageItem
              key={message.id}
              message={message}
              isOwnMessage={message.sender_id === currentUserId}
            />
          ))}
        </div>
      ))}
    </div>
  );
};

export default MessageList;
