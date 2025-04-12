
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";
import { Shift } from "../shifts/types/ShiftTypes";
import DashboardStats from "./components/DashboardStats";
import NextShiftCard from "./components/NextShiftCard";
import UpcomingShiftsList from "./components/UpcomingShiftsList";
import { useDashboardData } from "@/hooks/useDashboardData";
import { useState, useEffect } from "react";
import { useResponsive } from "@/hooks/useResponsive";
import { Button } from "../ui/button";
import { Award } from "lucide-react";

type PromoterDashboardProps = {
  shifts: Shift[];
};

export default function PromoterDashboard({ shifts }: PromoterDashboardProps) {
  const navigate = useNavigate();
  const { isMobile } = useResponsive();
  const { upcomingShifts, nextShift, completedShifts, totalEarned, unpaidAmount } = useDashboardData(shifts);
  const [loaded, setLoaded] = useState(false);
  
  // Get completed shifts for display in the Recent Activity section
  const completedShiftsList = shifts.filter(shift => shift.status === "completed");
  
  useEffect(() => {
    const timer = setTimeout(() => {
      setLoaded(true);
    }, 100);
    
    return () => clearTimeout(timer);
  }, []);
  
  return (
    <div className={`space-y-8 transition-all duration-500 ${loaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
      <div className="space-y-2">
        <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
          My Dashboard
        </h1>
        <p className="text-muted-foreground">Track your shifts and working hours</p>
      </div>
      
      <div className="grid grid-cols-1 gap-6">
        {/* Stats cards with staggered animation */}
        <DashboardStats 
          upcomingShifts={upcomingShifts}
          nextShift={nextShift}
          completedShifts={completedShifts}
          totalEarned={totalEarned}
          unpaidAmount={unpaidAmount}
        />
        
        {/* Certificate generation card */}
        <Card className="transition-all duration-500 delay-50 shadow-sm border-border/50 hover:shadow-md bg-gradient-to-r from-secondary/20 to-background">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-semibold flex items-center gap-2">
              <Award className="h-5 w-5 text-primary" />
              Work Certificates
            </CardTitle>
            <CardDescription>Generate professional work certificates for your job applications</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm mb-4">
              Create official certificates showing your completed work hours, skills gained, and performance records.
              Perfect for including with job applications!
            </p>
            <Button 
              onClick={() => navigate("/certificates")}
              className="w-full md:w-auto"
            >
              <Award className="mr-2 h-4 w-4" />
              Generate Certificate
            </Button>
          </CardContent>
        </Card>
        
        {/* Next shift with subtle animation */}
        <div className="transition-all duration-500 delay-100 transform hover:scale-[1.01]">
          <NextShiftCard 
            nextShift={nextShift}
            onViewDetails={() => nextShift && navigate(`/shifts/${nextShift.id}`)}
          />
        </div>
        
        {/* Upcoming shifts list */}
        {upcomingShifts.length > 1 && (
          <div className="transition-all duration-500 delay-200">
            <UpcomingShiftsList 
              shifts={upcomingShifts.slice(1)}
              onViewAll={() => navigate("/shifts")}
              onSelectShift={(shift) => navigate(`/shifts/${shift.id}`)}
            />
          </div>
        )}
        
        {/* Recent activity card - adding a new section */}
        {completedShiftsList.length > 0 && (
          <Card className="transition-all duration-500 delay-300 shadow-sm border-border/50 hover:shadow-md">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg font-semibold">Recent Activity</CardTitle>
              <CardDescription>Your latest completed shifts</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {completedShiftsList.slice(0, 3).map((shift, index) => (
                  <div 
                    key={shift.id} 
                    className="flex items-center justify-between p-3 rounded-md bg-secondary/50 hover:bg-secondary cursor-pointer"
                    onClick={() => navigate(`/shifts/${shift.id}`)}
                  >
                    <div>
                      <h3 className="font-medium text-sm">{shift.title}</h3>
                      <p className="text-xs text-muted-foreground">{shift.date} • {shift.startTime} - {shift.endTime}</p>
                    </div>
                    <div className="text-sm font-semibold text-green-600 dark:text-green-400">
                      ${(shift.payRate * 8).toFixed(2)}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
