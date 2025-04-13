
import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

export const useRealTimeEnabled = () => {
  useEffect(() => {
    // This is only needed once when the app initializes
    const enableRealtime = async () => {
      try {
        // Create a direct channel subscription instead of using RPC
        // This avoids the need for custom RPC functions
        const channel = supabase.channel('messages_realtime')
          .on('postgres_changes', {
            event: '*',
            schema: 'public',
            table: 'messages'
          }, (payload) => {
            // This callback will be triggered for any change to the messages table
            // We don't need to do anything here, just establishing the channel
            console.log('Realtime message update received');
          })
          .subscribe();
          
        console.log("Realtime subscription enabled for messages table");
        
        // Return unsubscribe function
        return () => {
          supabase.removeChannel(channel);
        };
      } catch (error) {
        console.error("Error enabling realtime:", error);
      }
    };

    // Call the function to enable realtime
    const unsubscribe = enableRealtime();
    
    // Cleanup on unmount
    return () => {
      if (unsubscribe && typeof unsubscribe === 'function') {
        unsubscribe();
      }
    };
  }, []);
};
