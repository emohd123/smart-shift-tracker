
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

          })
          .subscribe();



        // Return unsubscribe function
        return () => {
          supabase.removeChannel(channel);
        };
      } catch (error) {
        console.error("Error enabling realtime:", error);
      }
    };

    // Call the function to enable realtime
    const unsubscribePromise = enableRealtime();

    // Cleanup on unmount
    return () => {
      // Handle the promise properly
      unsubscribePromise.then(unsubscribe => {
        if (unsubscribe && typeof unsubscribe === 'function') {
          unsubscribe();
        }
      }).catch(err => {
        console.error("Error in cleanup:", err);
      });
    };
  }, []);
};
