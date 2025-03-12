import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import AppLayout from "@/components/layout/AppLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Calendar, Clock, Search } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { useNavigate } from "react-router-dom";
import { formatBHD } from "@/components/shifts/utils/currencyUtils";

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

const TimeHistory = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [timeLogs, setTimeLogs] = useState<TimeLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [totalEarnings, setTotalEarnings] = useState<number>(0);

  useEffect(() => {
    const fetchTimeLogs = async () => {
      if (!user) return;
      
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
          .eq('user_id', user.id)
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
    
    if (user) {
      fetchTimeLogs();
    }
  }, [user]);

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

  return (
    <AppLayout title="Time Tracking History">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <Button 
            variant="ghost" 
            size="sm" 
            className="mb-0" 
            onClick={() => navigate('/time-tracking')}
          >
            <ArrowLeft size={16} className="mr-1" />
            Back to Time Tracking
          </Button>
        </div>
        
        <Card>
          <CardHeader>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <CardTitle>Time Tracking History</CardTitle>
                <CardDescription>
                  Your complete time tracking record
                </CardDescription>
              </div>
              <div className="bg-muted/40 px-4 py-2 rounded-md text-center">
                <div className="text-sm text-muted-foreground">Total Earnings</div>
                <div className="text-xl font-bold">{formatBHD(totalEarnings)}</div>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="relative mb-6">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Search by shift name, location or date..."
                className="pl-9"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            
            {loading ? (
              <div className="flex flex-col space-y-4">
                <Skeleton className="h-20 w-full" />
                <Skeleton className="h-20 w-full" />
                <Skeleton className="h-20 w-full" />
              </div>
            ) : filteredLogs.length > 0 ? (
              <div className="space-y-4">
                {filteredLogs.map((log) => (
                  <div key={log.id} className="border rounded-md p-4 hover:bg-muted/50 transition-colors">
                    <div className="flex flex-col md:flex-row justify-between items-start gap-4">
                      <div>
                        <h4 className="font-medium flex items-center">
                          <Calendar className="h-4 w-4 mr-2 text-primary" />
                          {formatDate(log.check_in_time)}
                        </h4>
                        <h3 className="text-lg font-medium mt-1">{log.shift_title || "Unknown Shift"}</h3>
                        <div className="text-sm text-muted-foreground mt-1">
                          {log.shift_location || "Unknown Location"}
                        </div>
                      </div>
                      <div className="flex flex-col items-end">
                        <div className="font-medium text-lg">
                          {log.earnings ? formatBHD(log.earnings) : 'N/A'}
                        </div>
                        <div className="text-sm flex items-center mt-1">
                          <Clock className="h-3 w-3 mr-1 text-muted-foreground" />
                          {formatTime(log.check_in_time)} - {formatTime(log.check_out_time)}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {log.total_hours ? formatDuration(log.total_hours) : 'N/A'}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-muted/30 rounded-lg p-6 text-center">
                <Clock className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">No Time Logs Found</h3>
                <p className="text-muted-foreground">
                  {searchTerm 
                    ? "No time logs match your search criteria."
                    : "You don't have any completed time tracking sessions yet."}
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
};

export default TimeHistory;
