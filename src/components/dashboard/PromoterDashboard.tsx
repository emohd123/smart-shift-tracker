
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  CheckCircle, 
  Clock, 
  DollarSign, 
  MapPin, 
  Calendar, 
  AlertCircle,
  Wallet
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Shift } from "../shifts/ShiftCard";
import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import { formatBHD } from "../shifts/utils/currencyUtils";
import DashboardStats from "./components/DashboardStats";
import NextShiftCard from "./components/NextShiftCard";
import UpcomingShiftsList from "./components/UpcomingShiftsList";

type PrometerDashboardProps = {
  shifts: Shift[];
};

export default function PrometerDashboard({ shifts }: PrometerDashboardProps) {
  const navigate = useNavigate();
  
  // Get upcoming shifts
  const upcomingShifts = shifts.filter(shift => shift.status === "upcoming").slice(0, 3);
  
  // Get next shift
  const nextShift = upcomingShifts[0];
  
  // Calculate earnings (in a real app, this would come from an API)
  const totalEarned = shifts
    .filter(shift => shift.status === "completed")
    .reduce((sum, shift) => {
      // Assuming 8 hour shifts for simplicity
      const hours = 8;
      return sum + (shift.payRate * hours);
    }, 0);
  
  // Calculate unpaid amount (in a real app, this would come from an API)
  const unpaidAmount = shifts
    .filter(shift => shift.status === "completed" && shift.isPaid === false)
    .reduce((sum, shift) => {
      // Assuming 8 hour shifts for simplicity
      const hours = 8;
      return sum + (shift.payRate * hours);
    }, 0);
  
  const completedShifts = shifts.filter(shift => shift.status === "completed").length;
  
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
