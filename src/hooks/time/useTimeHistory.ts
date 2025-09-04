
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface TimeLog {
  id: string;
  shift_id: string;
  check_in_time: string;
  check_out_time: string;
  total_hours: number;
  earnings: number;
  shift_title?: string;
  shift_location?: string;
}

export const useTimeHistory = (userId: string | undefined) => {
  const [timeLogs, setTimeLogs] = useState<TimeLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [totalEarnings, setTotalEarnings] = useState<number>(0);

  useEffect(() => {
    const fetchTimeLogs = async () => {
      if (!userId) return;
      
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('time_logs')
          .select(`
            id,
            shift_id,
            check_in_time,
            check_out_time,
            total_hours,
            earnings
          `)
          .eq('user_id', userId)
          .not('check_out_time', 'is', null)
          .order('check_in_time', { ascending: false });
          
        if (error) {
          console.error("Error fetching time logs:", error);
          toast.error("Could not load time tracking history");
          return;
        }
        
        const total = data?.reduce((sum, log) => sum + (log.earnings || 0), 0) || 0;
        setTotalEarnings(total);
        
        const logsWithShiftDetails = await Promise.all((data || []).map(async (log) => {
          try {
            const { data: shiftData } = await supabase
              .from('shifts')
              .select('title, location')
              .eq('id', log.shift_id)
              .maybeSingle();
              
            return {
              ...log,
              shift_title: shiftData?.title || 'Unknown Shift',
              shift_location: shiftData?.location || 'Unknown Location'
            };
          } catch (error) {
            return {
              ...log,
              shift_title: 'Unknown Shift',
              shift_location: 'Unknown Location'
            };
          }
        }));
        
        setTimeLogs(logsWithShiftDetails);
      } catch (error) {
        console.error("Error retrieving time logs:", error);
        toast.error("Error loading time tracking history");
      } finally {
        setLoading(false);
      }
    };
    
    if (userId) {
      fetchTimeLogs();
    }
  }, [userId]);

  const formatTime = (isoString: string) => {
    return new Date(isoString).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
  };

  const formatDate = (isoString: string) => {
    return new Date(isoString).toLocaleDateString();
  };

  const formatDuration = (hours: number) => {
    const h = Math.floor(hours);
    const m = Math.round((hours - h) * 60);
    return `${h}h ${m}m`;
  };

  const filteredLogs = timeLogs.filter(log => {
    const searchTermLower = searchTerm.toLowerCase();
    return (
      (log.shift_title?.toLowerCase().includes(searchTermLower) || false) ||
      (log.shift_location?.toLowerCase().includes(searchTermLower) || false) ||
      formatDate(log.check_in_time).toLowerCase().includes(searchTermLower)
    );
  });

  return {
    timeLogs,
    filteredLogs,
    loading,
    searchTerm,
    setSearchTerm,
    totalEarnings,
    formatTime,
    formatDate,
    formatDuration
  };
};
