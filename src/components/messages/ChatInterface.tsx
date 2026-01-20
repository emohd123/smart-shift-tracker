
import { useState, useEffect, useRef } from "react";
import { User } from "@/context/AuthContext";
import { ArrowLeft, Send, Loader2, AlertCircle, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Alert, AlertDescription } from "@/components/ui/alert";
import MessageList from "./MessageList";
import { useMessages } from "@/hooks/messages/useMessages";
import { useSendMessage } from "@/hooks/messages/useSendMessage";
import { cn } from "@/lib/utils";
import { isAdminLike } from "@/utils/roleUtils";
import { HelpTooltip } from "@/components/ui/HelpTooltip";
import { tooltips } from "@/config/tooltips";

interface ChatInterfaceProps {
  currentUser: User | null;
  contact: User;
  onBackToContacts: () => void;
}

const ChatInterface = ({ currentUser, contact, onBackToContacts }: ChatInterfaceProps) => {
  const [message, setMessage] = useState("");
  const [error, setError] = useState<string | null>(null);
  const messageEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const { messages, loading, refreshMessages } = useMessages(currentUser?.id, contact.id);
  const { sendMessage, sending } = useSendMessage();

  // Focus input when contact changes
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, [contact.id]);

  // Scroll to bottom on new messages
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    if (messageEndRef.current) {
      messageEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!message.trim() || !currentUser) return;
    
    // Clear any previous errors
    setError(null);
    
    try {
      const sentMessage = await sendMessage({
        senderId: currentUser.id,
        receiverId: contact.id,
        content: message.trim()
      });
      
      setMessage("");
      
      // Manually refresh messages immediately to ensure the new message appears
      // This is a fallback in case real-time doesn't work
      if (refreshMessages) {
        // Small delay to ensure database write is complete
        setTimeout(() => {
          refreshMessages();
        }, 300);
      }
    } catch (error: any) {
      console.error("Failed to send message:", error);
      // Extract error message
      const errorMessage = error?.message || error?.error?.message || "Failed to send message. Please try again.";
      setError(errorMessage);
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(part => part[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="p-3 border-b flex items-center gap-2 bg-card shadow-sm">
        <Button 
          variant="ghost" 
          size="icon" 
          className="md:hidden" 
          onClick={onBackToContacts}
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        
        <Avatar className="h-10 w-10">
          <AvatarFallback className="bg-primary/10 text-primary">
            {getInitials(contact.name || "User")}
          </AvatarFallback>
        </Avatar>
        
        <div>
          <h3 className="font-medium">{contact.name}</h3>
          <p className="text-xs text-muted-foreground">
            {isAdminLike(contact.role) ? "Administrator" : "Promoter"}
          </p>
        </div>
      </div>
      
      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-2">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
            <span className="ml-2 text-sm text-muted-foreground">Loading messages...</span>
          </div>
        ) : messages.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <p className="text-muted-foreground mb-2">No messages yet</p>
              <p className="text-sm text-muted-foreground">Send a message to start the conversation</p>
            </div>
          </div>
        ) : (
          <MessageList 
            messages={messages} 
            currentUserId={currentUser?.id || ""} 
          />
        )}
        <div ref={messageEndRef} />
      </div>
      
      {/* Input area */}
      <div className="border-t">
        {error && (
          <Alert variant="destructive" className="m-3 mb-2">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="flex items-center justify-between">
              <span>{error}</span>
              <Button
                variant="ghost"
                size="icon"
                className="h-4 w-4 p-0"
                onClick={() => setError(null)}
              >
                <X className="h-3 w-3" />
              </Button>
            </AlertDescription>
          </Alert>
        )}
        <form onSubmit={handleSendMessage} className="p-3 flex gap-2 items-center">
          <Input
            ref={inputRef}
            value={message}
            onChange={(e) => {
              setMessage(e.target.value);
              // Clear error when user starts typing
              if (error) setError(null);
            }}
            placeholder="Type a message..."
            className="flex-1"
            disabled={sending || !currentUser}
          />
          <div className="flex items-center gap-2">
            <Button 
              type="submit" 
              size="icon" 
              disabled={!message.trim() || sending || !currentUser}
              className={cn(
                "transition-all", 
                sending && "animate-pulse"
              )}
            >
              {sending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </Button>
            <HelpTooltip content={tooltips.company.messages.sendMessage} />
          </div>
        </form>
      </div>
    </div>
  );
};

export default ChatInterface;
