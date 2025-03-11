
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import AppLayout from "@/components/layout/AppLayout";
import TimeTracker from "@/components/time/TimeTracker";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowRight, Calendar } from "lucide-react";
import { Shift } from "@/components/shifts/ShiftCard";
import { supabase } from "@/integrations/supabase/client";

const TimeTracking = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [activeShift, setActiveShift] = useState<Shift | null>(null);
  const [loading, setLoading] = useState(true);

  // Check for any active time tracking session on component mount
  useEffect(() => {
    const checkActiveTimeTracking = async () => {
      setLoading(true);
      
      try {
        // Check localStorage for any active tracking info
        const activeTrackingInfo = localStorage.getItem('activeTracking');
        
        if (activeTrackingInfo) {
          const { shiftId } = JSON.parse(activeTrackingInfo);
          
          // Fetch the shift details
          const { data, error } = await supabase
            .from('shifts')
            .select('*')
            .eq('id', shiftId)
            .single();
            
          if (data && !error) {
            setActiveShift(data);
          }
        }
      } catch (error) {
        console.error("Error checking active time tracking:", error);
      } finally {
        setLoading(false);
      }
    };
    
    checkActiveTimeTracking();
  }, []);

  const handleViewAllShifts = () => {
    navigate('/shifts');
  };

  return (
    <AppLayout title="Time Tracking">
      <div className="max-w-4xl mx-auto">
        <div className="space-y-8">
          {/* Active Time Tracking */}
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
                <div className="flex justify-center py-8">
                  <div className="animate-pulse text-muted-foreground">
                    Loading time tracking data...
                  </div>
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

          {/* Time Log History - Could be implemented in the future */}
          <Card>
            <CardHeader>
              <CardTitle>Time Tracking History</CardTitle>
              <CardDescription>
                Your recent time logs and earnings
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="bg-muted/30 rounded-lg p-6 text-center">
                <h3 className="text-lg font-medium mb-2">Coming Soon</h3>
                <p className="text-muted-foreground">
                  Time tracking history will be available in a future update.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </AppLayout>
  );
};

export default TimeTracking;
