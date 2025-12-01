
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
  const [dateFrom, setDateFrom] = useState<Date | null>(null);
  const [dateTo, setDateTo] = useState<Date | null>(null);
  const [selectedShiftId, setSelectedShiftId] = useState<string>('');
  const [minEarnings, setMinEarnings] = useState<number>(0);
  const [uniqueShifts, setUniqueShifts] = useState<Array<{ id: string; title: string }>>([]);

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
        
        // Get all unique shift IDs
        const shiftIds = [...new Set(data?.map(log => log.shift_id) || [])];
        
        // Fetch all shifts in one query through shift_assignments
        const { data: shiftsData } = await supabase
          .from('shift_assignments')
          .select(`
            shift_id,
            shifts!inner (
              id,
              title,
              location
            )
          `)
          .eq('promoter_id', userId)
          .in('shift_id', shiftIds);
        
        // Create a map for quick lookup
        const shiftMap = new Map(shiftsData?.map(s => [s.shift_id, s.shifts]) || []);
        
        // Map time logs with shift details
        const logsWithShiftDetails = data.map(log => ({
          ...log,
          shift_title: shiftMap.get(log.shift_id)?.title || 'Unknown Shift',
          shift_location: shiftMap.get(log.shift_id)?.location || 'Unknown Location'
        }));
        
        setTimeLogs(logsWithShiftDetails);
        
        // Extract unique shifts for filter dropdown
        const uniqueShiftsArray = Array.from(shiftMap.values())
          .filter((shift): shift is { id: string; title: string; location: string } => shift !== null)
          .map(shift => ({ id: shift.id, title: shift.title }));
        setUniqueShifts(uniqueShiftsArray);
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
    const matchesSearch = (
      (log.shift_title?.toLowerCase().includes(searchTermLower) || false) ||
      (log.shift_location?.toLowerCase().includes(searchTermLower) || false) ||
      formatDate(log.check_in_time).toLowerCase().includes(searchTermLower)
    );
    
    const checkInDate = new Date(log.check_in_time);
    const matchesDateRange = (
      (!dateFrom || checkInDate >= dateFrom) &&
      (!dateTo || checkInDate <= dateTo)
    );
    
    const matchesShift = !selectedShiftId || selectedShiftId === 'all' || log.shift_id === selectedShiftId;
    const matchesMinEarnings = !minEarnings || (log.earnings || 0) >= minEarnings;
    
    return matchesSearch && matchesDateRange && matchesShift && matchesMinEarnings;
  });

  const clearFilters = () => {
    setDateFrom(null);
    setDateTo(null);
    setSelectedShiftId('');
    setMinEarnings(0);
  };

  return {
    timeLogs,
    filteredLogs,
    loading,
    searchTerm,
    setSearchTerm,
    totalEarnings,
    formatTime,
    formatDate,
    formatDuration,
    dateFrom,
    setDateFrom,
    dateTo,
    setDateTo,
    selectedShiftId,
    setSelectedShiftId,
    minEarnings,
    setMinEarnings,
    uniqueShifts,
    clearFilters
  };
};
