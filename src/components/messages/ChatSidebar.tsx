
import { User } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, Search, MessageSquare } from "lucide-react";
import { useState, useEffect } from "react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { useMessages } from "@/hooks/messages/useMessages";

interface ChatSidebarProps {
  contacts: User[];
  selectedContactId: string;
  onSelectContact: (contact: User) => void;
  loading: boolean;
  currentUser: User | null;
  isMobileView?: boolean;
}

const ChatSidebar = ({
  contacts,
  selectedContactId,
  onSelectContact,
  loading,
  currentUser,
  isMobileView = false
}: ChatSidebarProps) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [filteredContacts, setFilteredContacts] = useState(contacts);

  // Filter contacts based on search
  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredContacts(contacts);
      return;
    }

    const query = searchQuery.toLowerCase();
    const filtered = contacts.filter(
      contact => contact.name?.toLowerCase().includes(query)
    );
    setFilteredContacts(filtered);
  }, [searchQuery, contacts]);

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(part => part[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };

  return (
    <div className={cn("flex flex-col h-full", isMobileView ? "max-h-96 border rounded-lg overflow-hidden" : "")}>
      <div className="p-3 border-b">
        <h3 className="font-medium mb-3">Messages</h3>
        <div className="relative">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search contacts..."
            className="pl-8"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="p-3 space-y-3">
            {Array.from({ length: 5 }).map((_, index) => (
              <div key={index} className="flex items-center gap-2">
                <Skeleton className="h-10 w-10 rounded-full" />
                <div className="space-y-1.5">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-3 w-24" />
                </div>
              </div>
            ))}
          </div>
        ) : filteredContacts.length > 0 ? (
          <div className="p-1.5">
            {filteredContacts.map((contact) => (
              <ContactItem
                key={contact.id}
                contact={contact}
                isSelected={contact.id === selectedContactId}
                onClick={() => onSelectContact(contact)}
                currentUserId={currentUser?.id || ""}
              />
            ))}
          </div>
        ) : searchQuery ? (
          <div className="flex flex-col items-center justify-center h-40 px-4 text-center">
            <p className="text-muted-foreground text-sm">No contacts matching "{searchQuery}"</p>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-40 px-4 text-center">
            <MessageSquare className="h-8 w-8 text-muted-foreground mb-2" />
            <h4 className="font-medium">No contacts yet</h4>
            <p className="text-xs text-muted-foreground mt-1">Your communication history will appear here</p>
          </div>
        )}
      </div>
    </div>
  );
};

interface ContactItemProps {
  contact: User;
  isSelected: boolean;
  onClick: () => void;
  currentUserId: string;
}

const ContactItem = ({ contact, isSelected, onClick, currentUserId }: ContactItemProps) => {
  const { lastMessage, loading } = useMessages(currentUserId, contact.id, true);
  
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(part => part[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };

  return (
    <Button
      variant="ghost"
      className={cn(
        "w-full justify-start mb-1 p-2 h-auto",
        isSelected && "bg-secondary",
        !isSelected && "hover:bg-secondary/50"
      )}
      onClick={onClick}
    >
      <div className="flex items-center w-full">
        <Avatar className="h-10 w-10 mr-3">
          <AvatarFallback className={cn(
            "text-primary",
            contact.role === "admin" ? "bg-primary/15" : "bg-secondary"
          )}>
            {getInitials(contact.name || "User")}
          </AvatarFallback>
        </Avatar>
        
        <div className="flex-1 text-left">
          <div className="flex justify-between">
            <p className="font-medium truncate">{contact.name}</p>
            {lastMessage && (
              <span className="text-xs text-muted-foreground">
                {new Date(lastMessage.created_at).toLocaleTimeString([], {
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </span>
            )}
          </div>
          
          <div className="text-xs text-muted-foreground truncate">
            {loading ? (
              <Loader2 className="h-3 w-3 animate-spin inline mr-1" />
            ) : lastMessage ? (
              <span className="truncate">
                {lastMessage.sender_id === currentUserId ? "You: " : ""}
                {lastMessage.content}
              </span>
            ) : (
              <span className="italic">Start a conversation</span>
            )}
          </div>
        </div>
      </div>
    </Button>
  );
};

export default ChatSidebar;
