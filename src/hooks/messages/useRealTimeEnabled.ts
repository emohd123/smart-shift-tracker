
import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

export const useRealTimeEnabled = () => {
  useEffect(() => {
    // This is only needed once when the app initializes
    const enableRealtime = async () => {
      try {
        // Check if the messages table is already in the publication
        const { data, error } = await supabase
          .rpc('supabase_functions.is_table_in_publication', {
            _table_name: 'messages',
            _publication_name: 'supabase_realtime'
          });

        if (error) {
          console.error("Error checking realtime status:", error);
          return;
        }

        // If not already enabled, enable it
        if (!data) {
          await supabase.rpc('supabase_functions.add_table_to_publication', {
            _table_name: 'messages',
            _publication_name: 'supabase_realtime'
          });
          console.log("Realtime enabled for messages table");
        }
      } catch (error) {
        console.error("Error in enableRealtime:", error);
      }
    };

    enableRealtime();
  }, []);
};
