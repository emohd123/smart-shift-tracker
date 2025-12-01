
import React, { useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  CheckCircle, 
  Clock, 
  DollarSign, 
  Users, 
  Calendar, 
  BarChart3, 
  AlertCircle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import ShiftList from "../shifts/ShiftList";
import { Shift } from "../shifts/types/ShiftTypes";
import { Separator } from "@/components/ui/separator";
import { useNavigate } from "react-router-dom";
import { formatBHD } from "../shifts/utils/currencyUtils";
import { LoadingState } from "@/components/ui/enhanced-loading";
import { ErrorBoundary } from "@/components/ui/error-boundary";
import { getEffectiveStatus } from "../shifts/utils/statusCalculations";

type AdminDashboardProps = {
  shifts: Shift[];
  loading?: boolean;
};

const AdminDashboard = React.memo(({ shifts, loading = false }: AdminDashboardProps) => {
  const navigate = useNavigate();
  
  // Memoized calculations for performance
  const dashboardStats = useMemo(() => {
    const today = new Date().toISOString().split('T')[0];
    
    const todaysShifts = shifts.filter(shift => shift.date === today);
    const ongoingShifts = shifts.filter(shift => getEffectiveStatus(shift) === "ongoing");
    const completedShifts = shifts.filter(shift => getEffectiveStatus(shift) === "completed");
    
    // Calculate earnings (this would come from API in real app)
    const totalPayable = completedShifts.reduce((sum, shift) => {
      const hours = 8; // Assuming 8 hour shifts
      return sum + (shift.payRate * hours);
    }, 0);
    
    return {
      todaysShifts,
      ongoingShifts,
      completedShifts,
      totalPayable
    };
  }, [shifts]);
  
  if (loading) {
    return <LoadingState message="Loading dashboard..." />;
  }

  const { todaysShifts, ongoingShifts, completedShifts, totalPayable } = dashboardStats;

  return (
    <ErrorBoundary>
      <div className="space-y-8 animate-fade-in">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold">Admin Dashboard</h1>
          <p className="text-muted-foreground">Manage shifts, promoters and track operations</p>
        </div>
        
        {/* Stats cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="hover-scale">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center text-base font-medium">
                <Calendar className="h-4 w-4 mr-2 text-muted-foreground" />
                Today's Shifts
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{todaysShifts.length}</div>
              <p className="text-xs text-muted-foreground mt-1">
                {ongoingShifts.length} currently active
              </p>
            </CardContent>
          </Card>
          
          <Card className="hover-scale">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center text-base font-medium">
                <Users className="h-4 w-4 mr-2 text-muted-foreground" />
                Active Promoters
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">0</div>
              <p className="text-xs text-muted-foreground mt-1">
                0 scheduled today
              </p>
            </CardContent>
          </Card>
          
          <Card className="hover-scale">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center text-base font-medium">
                <Clock className="h-4 w-4 mr-2 text-muted-foreground" />
                Hours Tracked
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">0</div>
              <p className="text-xs text-muted-foreground mt-1">
                This week (Mon-Sun)
              </p>
            </CardContent>
          </Card>
          
          <Card className="hover-scale">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center text-base font-medium">
                <DollarSign className="h-4 w-4 mr-2 text-muted-foreground" />
                Payable Amount
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatBHD(totalPayable)}</div>
              <p className="text-xs text-muted-foreground mt-1">
                Pending approval
              </p>
            </CardContent>
          </Card>
        </div>
      
      {/* Live attendance */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">Live Attendance</h2>
          <Button variant="outline" size="sm" onClick={() => navigate("/time")}>
            View All
          </Button>
        </div>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-medium">Currently Working</CardTitle>
            <CardDescription>Real-time view of clock-ins</CardDescription>
          </CardHeader>
          <CardContent>
            {ongoingShifts.length > 0 ? (
              <div className="space-y-3">
                {ongoingShifts.map((shift, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary mr-3">
                        <Users size={14} />
                      </div>
                      <div>
                        <div className="font-medium">{`Promoter ${index + 1}`}</div>
                        <div className="text-sm text-muted-foreground">{shift.title}</div>
                      </div>
                    </div>
                    <div className="flex items-center">
                      <div className="mr-4 text-sm">
                        <span className="text-muted-foreground">Started: </span>
                        {shift.startTime}
                      </div>
                      <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex items-center justify-center py-6 text-muted-foreground">
                <AlertCircle size={16} className="mr-2" />
                No active shifts at the moment
              </div>
            )}
          </CardContent>
        </Card>
      </div>
      
      {/* Recent shifts */}
      <div>
        <ShiftList shifts={shifts.slice(0, 8)} title="Recent Shifts" />
        {shifts.length > 8 && (
          <div className="flex justify-center mt-6">
            <Button variant="outline" onClick={() => navigate("/shifts")}>
              View All Shifts
            </Button>
          </div>
        )}
        </div>
      </div>
    </ErrorBoundary>
  );
});

AdminDashboard.displayName = "AdminDashboard";

export default AdminDashboard;
