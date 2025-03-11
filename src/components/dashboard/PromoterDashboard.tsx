
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";
import { Shift } from "../shifts/ShiftCard";
import DashboardStats from "./components/DashboardStats";
import NextShiftCard from "./components/NextShiftCard";
import UpcomingShiftsList from "./components/UpcomingShiftsList";
import { useDashboardData } from "@/hooks/useDashboardData";

type PrometerDashboardProps = {
  shifts: Shift[];
};

export default function PrometerDashboard({ shifts }: PrometerDashboardProps) {
  const navigate = useNavigate();
  const { upcomingShifts, nextShift, completedShifts, totalEarned, unpaidAmount } = useDashboardData(shifts);
  
  return (
    <div className="space-y-8 animate-fade-in">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold">My Dashboard</h1>
        <p className="text-muted-foreground">Track your shifts and working hours</p>
      </div>
      
      <div className="grid grid-cols-1 gap-6">
        {/* Stats cards */}
        <DashboardStats 
          upcomingShifts={upcomingShifts}
          nextShift={nextShift}
          completedShifts={completedShifts}
          totalEarned={totalEarned}
          unpaidAmount={unpaidAmount}
        />
        
        {/* Next shift */}
        <NextShiftCard 
          nextShift={nextShift}
          onViewDetails={() => nextShift && navigate(`/shifts/${nextShift.id}`)}
        />
        
        {/* Upcoming shifts list */}
        {upcomingShifts.length > 1 && (
          <UpcomingShiftsList 
            shifts={upcomingShifts.slice(1)}
            onViewAll={() => navigate("/shifts")}
            onSelectShift={(shift) => navigate(`/shifts/${shift.id}`)}
          />
        )}
      </div>
    </div>
  );
}
