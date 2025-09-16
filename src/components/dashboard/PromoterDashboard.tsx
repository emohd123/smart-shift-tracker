
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
import { Award, User, Clock, DollarSign, Briefcase, Copy, CheckCircle, Info } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { Badge } from "../ui/badge";
import { toast } from "sonner";

type PromoterDashboardProps = {
  shifts: Shift[];
};

export default function PromoterDashboard({ shifts }: PromoterDashboardProps) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { isMobile } = useResponsive();
  const { upcomingShifts, nextShift, completedShifts, totalEarned, unpaidAmount } = useDashboardData(shifts);
  const [loaded, setLoaded] = useState(false);
  const [copied, setCopied] = useState(false);

  // Get unique code with fallback
  const uniqueCode = (user?.metadata?.unique_code as string) || 
                     'USR' + (user?.id?.slice(-5).toUpperCase() || '00001');

  const handleCopyCode = async () => {
    try {
      await navigator.clipboard.writeText(uniqueCode);
      setCopied(true);
      toast.success("Unique code copied to clipboard!");
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      toast.error("Failed to copy code");
    }
  };
  
  // Calculate performance metrics
    const calculateHours = (shift: Shift) => {
    if (shift.startTime && shift.endTime) {
      const start = new Date(`2000-01-01T${shift.startTime}`);
      const end = new Date(`2000-01-01T${shift.endTime}`);
      return Math.max(0, (end.getTime() - start.getTime()) / (1000 * 60 * 60));
    }
    return 8; // Default 8 hours
  };

  // Calculate total hours worked
  const totalHours = shifts.reduce((total, shift) => total + calculateHours(shift), 0);
  const completedShiftsList = shifts.filter(shift => shift.status === "completed");
  const activeShifts = shifts.filter(shift => shift.status === "ongoing");
  
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
          Part-Timer Dashboard
        </h1>
        <p className="text-muted-foreground">Track your assigned shifts, hours, and generate work certificates</p>
      </div>

      {/* Unique Code Highlight Card */}
      <Card className="bg-gradient-to-r from-primary/10 to-purple-100/20 border-primary/30 border-2">
        <CardHeader className="pb-3">
          <CardTitle className="text-xl font-bold flex items-center gap-2">
            <User className="h-6 w-6 text-primary" />
            Your Unique Promoter Code
          </CardTitle>
          <CardDescription className="text-base">
            Companies use this code to find and assign you to shifts
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-center md:justify-start gap-3">
              <Badge variant="secondary" className="text-2xl font-mono px-6 py-3 bg-primary/10 text-primary border-primary/20">
                {uniqueCode}
              </Badge>
              <Button
                variant="outline"
                size="sm"
                onClick={handleCopyCode}
                className="flex items-center gap-2 border-primary/30 hover:bg-primary/10"
              >
                {copied ? <CheckCircle className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                {copied ? 'Copied!' : 'Copy Code'}
              </Button>
            </div>
            
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-start gap-2">
                <Info className="h-5 w-5 text-blue-500 mt-0.5 flex-shrink-0" />
                <div className="text-sm text-blue-800 space-y-1">
                  <p className="font-medium">How to use your unique code:</p>
                  <p>• Share this code when applying for shifts</p>
                  <p>• Companies search by your code to assign you</p>
                  <p>• Keep this code handy for quick job assignments</p>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Profile Stats Card */}
      <Card className="bg-gradient-to-r from-secondary/10 to-primary/5 border-secondary/20">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg font-semibold flex items-center gap-2">
            <Briefcase className="h-5 w-5 text-secondary" />
            Your Performance
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Name</p>
              <p className="font-medium">{user?.name || user?.email?.split('@')[0] || 'Loading...'}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Hours</p>
              <p className="font-medium flex items-center gap-1">
                <Clock className="h-4 w-4" />
                {totalHours.toFixed(1)}h
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Earnings</p>
              <p className="font-medium flex items-center gap-1 text-green-600">
                <DollarSign className="h-4 w-4" />
                ${totalEarned.toFixed(2)}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Completed Shifts</p>
              <p className="font-medium flex items-center gap-1">
                <Award className="h-4 w-4" />
                {completedShiftsList.length}
              </p>
            </div>
          </div>
          
          {/* Additional user info from metadata */}
          {user?.metadata && (
            <div className="mt-4 pt-4 border-t border-border/50">
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                {user.metadata.nationality && (
                  <div>
                    <span className="text-muted-foreground">Nationality:</span>
                    <span className="ml-2 font-medium">{user.metadata.nationality as string}</span>
                  </div>
                )}
                {user.metadata.age && (
                  <div>
                    <span className="text-muted-foreground">Age:</span>
                    <span className="ml-2 font-medium">{user.metadata.age as string}</span>
                  </div>
                )}
                {user.metadata.gender && (
                  <div>
                    <span className="text-muted-foreground">Gender:</span>
                    <span className="ml-2 font-medium">{user.metadata.gender as string}</span>
                  </div>
                )}
                {user.metadata.address && (
                  <div className="md:col-span-2">
                    <span className="text-muted-foreground">Address:</span>
                    <span className="ml-2 font-medium">{user.metadata.address as string}</span>
                  </div>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
      
      <div className="grid grid-cols-1 gap-6">
        {/* Enhanced Stats cards */}
        <DashboardStats 
          upcomingShifts={upcomingShifts}
          nextShift={nextShift}
          completedShifts={completedShifts}
          totalEarned={totalEarned}
          unpaidAmount={unpaidAmount}
        />
        
        {/* Certificate Generation - Main Revenue Feature */}
        <Card className="transition-all duration-500 delay-50 shadow-sm border-border/50 hover:shadow-md bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20 border-green-200 dark:border-green-800">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-semibold flex items-center gap-2 text-green-700 dark:text-green-300">
              <Award className="h-5 w-5" />
              Professional Work Certificates ($9.99)
            </CardTitle>
            <CardDescription>Generate official PDF certificates for your completed work</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="bg-white dark:bg-gray-800 p-3 rounded-lg border">
                <h4 className="font-medium mb-2">Certificate includes:</h4>
                <ul className="text-sm space-y-1 text-muted-foreground">
                  <li>• Total hours worked: {totalHours.toFixed(1)} hours</li>
                  <li>• Completed campaigns: {Math.max(0, shifts.length)}</li>
                  <li>• Work period & client details</li>
                  <li>• Performance verification</li>
                  <li>• Professional PDF format</li>
                </ul>
              </div>
              <Button 
                onClick={() => navigate("/certificates")}
                className="w-full bg-green-600 hover:bg-green-700 text-white"
                disabled={shifts.length === 0}
              >
                <Award className="mr-2 h-4 w-4" />
                Generate Certificate - $9.99
              </Button>
              {shifts.length === 0 && (
                <p className="text-xs text-muted-foreground text-center">
                  Complete at least one shift to generate certificates
                </p>
              )}
            </div>
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
        {shifts.length > 0 && (
          <Card className="transition-all duration-500 delay-300 shadow-sm border-border/50 hover:shadow-md">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg font-semibold">Recent Activity</CardTitle>
              <CardDescription>Your latest completed shifts</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {shifts.slice(0, 3).map((shift, index) => (
                  <div 
                    key={shift.id} 
                    className="flex items-center justify-between p-3 rounded-md bg-secondary/50 hover:bg-secondary cursor-pointer"
                    onClick={() => navigate(`/shifts/${shift.id}`)}
                  >
                    <div>
                      <h3 className="font-medium text-sm">{shift.title || 'Shift'}</h3>
                      <p className="text-xs text-muted-foreground">{shift.date || new Date().toLocaleDateString()} • {shift.startTime || '9:00 AM'} - {shift.endTime || '5:00 PM'}</p>
                    </div>
                    <div className="text-sm font-semibold text-green-600 dark:text-green-400">
                      ${((shift.payRate || 15) * 8).toFixed(2)}
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
