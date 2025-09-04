import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import AppLayout from "@/components/layout/AppLayout";
import ChatInterface from "@/components/messages/ChatInterface";
import ChatSidebar from "@/components/messages/ChatSidebar";
import { User } from "@/context/AuthContext";
import { useMessageContacts } from "@/hooks/messages/useMessageContacts";
import { useRealTimeEnabled } from "@/hooks/messages/useRealTimeEnabled";
import { toast } from "sonner";

const Messages = () => {
  const { user } = useAuth();
  const [selectedContact, setSelectedContact] = useState<User | null>(null);
  const { contacts, loading: loadingContacts } = useMessageContacts();
  
  // Enable realtime for the messages table
  useRealTimeEnabled();

  // Select the first contact by default when contacts load
  useEffect(() => {
    if (contacts.length > 0 && !selectedContact) {
      setSelectedContact(contacts[0]);
    }
  }, [contacts, selectedContact]);

  const handleSelectContact = (contact: User) => {
    setSelectedContact(contact);
    toast.dismiss();
  };

  return (
    <AppLayout title="Messages">
      <div className="flex h-[calc(100vh-150px)] overflow-hidden rounded-lg border border-border/50 bg-card/50 shadow-sm">
        {/* Chat sidebar with contact list */}
        <div className="w-80 border-r border-border/40 hidden md:block">
          <ChatSidebar 
            contacts={contacts}
            selectedContactId={selectedContact?.id || ""}
            onSelectContact={handleSelectContact}
            loading={loadingContacts}
            currentUser={user}
          />
        </div>
        
        {/* Main chat interface */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {selectedContact ? (
            <ChatInterface 
              currentUser={user}
              contact={selectedContact}
              onBackToContacts={() => setSelectedContact(null)}
            />
          ) : (
            <div className="flex items-center justify-center h-full">
              <div className="text-center p-6">
                <h3 className="text-lg font-medium mb-2">Select a conversation</h3>
                <p className="text-muted-foreground">
                  Choose a contact from the sidebar to start chatting
                </p>
                
                {/* Mobile only selection */}
                <div className="mt-6 md:hidden">
                  <ChatSidebar 
                    contacts={contacts}
                    selectedContactId={selectedContact?.id || ""}
                    onSelectContact={handleSelectContact}
                    loading={loadingContacts}
                    currentUser={user}
                    isMobileView
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
};

export default Messages;
