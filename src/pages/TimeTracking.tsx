import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import AppLayout from "@/components/layout/AppLayout";
import TimeTracker from "@/components/time/TimeTracker";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowRight, Calendar, Clock } from "lucide-react";
import { Shift } from "@/components/shifts/types/ShiftTypes";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";
import { ShiftStatus } from "@/types/database";
import { formatBHD } from "@/components/shifts/utils/currencyUtils";


const TimeTracking = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [activeShift, setActiveShift] = useState<Shift | null>(null);
  const [loading, setLoading] = useState(true);
  const [timeLogHistory, setTimeLogHistory] = useState<any[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(true);

  useEffect(() => {
    const checkActiveTimeTracking = async () => {
      if (!user) return;
      
      setLoading(true);
      
      try {
        const activeTrackingInfo = localStorage.getItem('activeTracking');
        
        if (activeTrackingInfo) {
          const { shiftId } = JSON.parse(activeTrackingInfo);
          
          const { data: timeLogData, error: timeLogError } = await supabase
            .from('time_logs')
            .select(`
              id,
              shift_id,
              check_in_time,
              check_out_time
            `)
            .eq('shift_id', shiftId)
            .eq('user_id', user.id)
            .is('check_out_time', null)
            .maybeSingle();
          
        if (timeLogError) {
          console.error("Error fetching time log:", timeLogError);
          toast.error("Could not retrieve active time tracking session");
          setLoading(false);
          return;
        }
        
        if (timeLogData) {
          try {
            const { data: shiftData, error: shiftError } = await supabase
              .from('shifts')
              .select('*')
              .eq('id', timeLogData.shift_id)
              .maybeSingle();
              
            if (shiftData && !shiftError) {
              const shift: Shift = {
                id: shiftData.id,
                title: shiftData.title,
                date: shiftData.date,
                startTime: shiftData.start_time,
                endTime: shiftData.end_time,
                location: shiftData.location,
                status: shiftData.status as ShiftStatus,
                payRate: shiftData.pay_rate,
                isPaid: shiftData.is_paid || false
              };
              
              setActiveShift(shift);
            } else {
              setActiveShift(null);
            }
          } catch (error) {
            console.error("Error retrieving shift data:", error);
            setActiveShift(null);
          }
        }
      }
    } catch (error) {
      console.error("Error checking active time tracking:", error);
      toast.error("Error loading time tracking data");
    } finally {
      setLoading(false);
    }
  };
  
  const fetchTimeLogHistory = async () => {
    if (!user) return;
    
    setLoadingHistory(true);
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
        .order('check_in_time', { ascending: false })
        .limit(5);
        
      if (error) {
        console.error("Error fetching time log history:", error);
      } else {
        setTimeLogHistory(data || []);
      }
    } catch (error) {
      console.error("Error retrieving time log history:", error);
    } finally {
      setLoadingHistory(false);
    }
  };
  
  if (user) {
    checkActiveTimeTracking();
    fetchTimeLogHistory();
  }
}, [user]);

  const handleViewAllShifts = () => {
    navigate('/shifts');
  };

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

  return (
    <AppLayout title="Time Tracking">
      <div className="max-w-4xl mx-auto">
        <div className="space-y-8">
          <Card>
            <CardHeader>
              <CardTitle>Time Tracking</CardTitle>
              <CardDescription>
                {activeShift 
                  ? "You are currently tracking time for an active shift"
                  : "You don't have any active time tracking sessions"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex flex-col space-y-4 py-8">
                  <Skeleton className="h-12 w-full" />
                  <Skeleton className="h-12 w-3/4" />
                  <Skeleton className="h-12 w-1/2" />
                </div>
              ) : activeShift ? (
                <TimeTracker shift={activeShift} />
              ) : (
                <div className="bg-muted/30 rounded-lg p-6 text-center">
                  <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium mb-2">No Active Tracking</h3>
                  <p className="text-muted-foreground mb-4">
                    Start tracking time from any of your upcoming shifts.
                  </p>
                  <Button onClick={handleViewAllShifts}>
                    View Shifts
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Time Tracking History</CardTitle>
              <CardDescription>
                Your recent time logs and earnings
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loadingHistory ? (
                <div className="flex flex-col space-y-4">
                  <Skeleton className="h-16 w-full" />
                  <Skeleton className="h-16 w-full" />
                  <Skeleton className="h-16 w-full" />
                </div>
              ) : timeLogHistory.length > 0 ? (
                <div className="space-y-4">
                  {timeLogHistory.map((log) => (
                    <div key={log.id} className="border rounded-md p-4 hover:bg-muted/50 transition-colors">
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="font-medium flex items-center">
                            <Clock className="h-4 w-4 mr-2 text-primary" />
                            {formatDate(log.check_in_time)}
                          </h4>
                          <div className="text-sm text-muted-foreground mt-1">
                            {formatTime(log.check_in_time)} - {formatTime(log.check_out_time)}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-medium">
                            {log.earnings ? formatBHD(log.earnings) : 'N/A'}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {log.total_hours ? formatDuration(log.total_hours) : 'N/A'}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                  
                  <Button variant="outline" className="w-full" onClick={() => navigate('/time-history')}>
                    View Full History
                  </Button>
                </div>
              ) : (
                <div className="bg-muted/30 rounded-lg p-6 text-center">
                  <h3 className="text-lg font-medium mb-2">No Time Logs Yet</h3>
                  <p className="text-muted-foreground">
                    Your completed time tracking sessions will appear here.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </AppLayout>
  );
};

export default TimeTracking;
