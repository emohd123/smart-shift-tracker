import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  CheckCircle, 
  Clock, 
  DollarSign, 
  MapPin, 
  Calendar, 
  AlertCircle 
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Shift } from "../shifts/ShiftCard";
import TimeTracker from "../time/TimeTracker";
import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import { formatBHD } from "../shifts/utils/currencyUtils";

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
  
  const completedShifts = shifts.filter(shift => shift.status === "completed").length;
  
  return (
    <div className="space-y-8 animate-fade-in">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold">My Dashboard</h1>
        <p className="text-muted-foreground">Track your shifts and working hours</p>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Stats cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center text-base font-medium">
                  <Calendar className="h-4 w-4 mr-2 text-muted-foreground" />
                  Upcoming Shifts
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{upcomingShifts.length}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  {nextShift ? `Next: ${new Date(nextShift.date).toLocaleDateString()}` : "No upcoming shifts"}
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center text-base font-medium">
                  <CheckCircle className="h-4 w-4 mr-2 text-muted-foreground" />
                  Completed
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{completedShifts}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  Total shifts completed
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center text-base font-medium">
                  <DollarSign className="h-4 w-4 mr-2 text-muted-foreground" />
                  Earnings
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatBHD(totalEarned)}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  Total earned this month
                </p>
              </CardContent>
            </Card>
          </div>
          
          {/* Next shift */}
          <div>
            <h2 className="text-xl font-semibold mb-4">Next Shift</h2>
            
            {nextShift ? (
              <Card className="border border-primary/10 hover:border-primary/30 transition-colors duration-300">
                <CardHeader className="pb-2">
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle>{nextShift.title}</CardTitle>
                      <CardDescription className="mt-1">
                        <span className="text-muted-foreground">
                          {new Date(nextShift.date).toLocaleDateString(undefined, { 
                            weekday: 'long', 
                            month: 'long', 
                            day: 'numeric' 
                          })}
                        </span>
                      </CardDescription>
                    </div>
                    <Badge className="bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
                      Upcoming
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="pb-4">
                  <div className="space-y-3 text-sm">
                    <div className="flex items-center text-muted-foreground">
                      <Clock size={16} className="mr-3" />
                      <span>{nextShift.startTime} - {nextShift.endTime}</span>
                    </div>
                    
                    <div className="flex items-center text-muted-foreground">
                      <MapPin size={16} className="mr-3" />
                      <span>{nextShift.location}</span>
                    </div>
                    
                    <div className="flex items-center text-muted-foreground">
                      <DollarSign size={16} className="mr-3" />
                      <span>{formatBHD(nextShift.payRate)}/hr</span>
                    </div>
                  </div>
                </CardContent>
                <div className="px-6 pb-6">
                  <Button 
                    onClick={() => navigate(`/shifts/${nextShift.id}`)}
                    className="w-full"
                  >
                    View Details
                  </Button>
                </div>
              </Card>
            ) : (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <AlertCircle className="h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium mb-1">No Upcoming Shifts</h3>
                  <p className="text-muted-foreground text-center mb-4">
                    You don't have any shifts scheduled at the moment.
                  </p>
                  <Button variant="outline" onClick={() => navigate("/shifts")}>
                    Check Available Shifts
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
          
          {/* Upcoming shifts list */}
          {upcomingShifts.length > 1 && (
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold">Upcoming Shifts</h2>
                <Button variant="outline" size="sm" onClick={() => navigate("/shifts")}>
                  View All
                </Button>
              </div>
              
              <div className="space-y-3">
                {upcomingShifts.slice(1).map((shift, index) => (
                  <Card 
                    key={index}
                    className={cn(
                      "hover-scale button-press cursor-pointer",
                      "border-border/50 hover:border-border"
                    )}
                    onClick={() => navigate(`/shifts/${shift.id}`)}
                  >
                    <CardContent className="p-4">
                      <div className="flex justify-between items-center gap-4">
                        <div className="min-w-0">
                          <h3 className="font-medium truncate">{shift.title}</h3>
                          <div className="flex items-center mt-1">
                            <Calendar size={14} className="text-muted-foreground mr-1" />
                            <span className="text-sm text-muted-foreground">
                              {new Date(shift.date).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                        <div className="text-right flex-shrink-0">
                          <div className="text-sm font-medium">
                            {shift.startTime} - {shift.endTime}
                          </div>
                          <div className="text-sm text-muted-foreground mt-1">
                            {formatBHD(shift.payRate)}/hr
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </div>
        
        {/* Time Tracker */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">Time Tracker</h2>
          <TimeTracker shift={shifts.find(s => s.status === "ongoing")} />
        </div>
      </div>
    </div>
  );
}
