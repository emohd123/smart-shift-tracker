
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
import { Award, Copy, Check, CheckCircle } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";
import { getEffectiveStatus } from "../shifts/utils/statusCalculations";
import { Badge } from "../ui/badge";
import { supabase } from "@/integrations/supabase/client";

type PromoterDashboardProps = {
  shifts: Shift[];
  loading?: boolean;
};

export default function PromoterDashboard({ shifts, loading = false }: PromoterDashboardProps) {
  const navigate = useNavigate();
  const { isMobile } = useResponsive();
  const { user } = useAuth();
  const { upcomingShifts, nextShift, completedShifts, totalEarned, unpaidAmount } = useDashboardData(shifts);
  const [loaded, setLoaded] = useState(false);
  const [copied, setCopied] = useState(false);
  const [approvedShiftsCount, setApprovedShiftsCount] = useState(0);
  const [approvedShiftIds, setApprovedShiftIds] = useState<Set<string>>(new Set());
  
  // Get completed shifts for display in the Recent Activity section
  const completedShiftsList = shifts.filter(shift => getEffectiveStatus(shift) === "completed");
  
  useEffect(() => {
    const timer = setTimeout(() => {
      setLoaded(true);
    }, 100);
    
    return () => clearTimeout(timer);
  }, []);

  // Fetch approved shifts count
  useEffect(() => {
    const fetchApprovedShifts = async () => {
      if (!user?.id) return;
      
      const { data, error } = await supabase
        .from('shift_assignments')
        .select('id, shift_id')
        .eq('promoter_id', user.id)
        .eq('certificate_approved', true);

      if (!error && data) {
        setApprovedShiftsCount(data.length);
        setApprovedShiftIds(new Set(data.map(a => a.shift_id)));
      }
    };

    fetchApprovedShifts();
  }, [user?.id]);
  
  const handleCopyCode = async () => {
    if (user?.unique_code) {
      try {
        await navigator.clipboard.writeText(user.unique_code);
        setCopied(true);
        toast.success("Code copied to clipboard!");
        setTimeout(() => setCopied(false), 2000);
      } catch (err) {
        toast.error("Failed to copy code");
      }
    }
  };

  if (loading) {
    return (
      <div className="space-y-8 p-4 md:p-6">
        <div className="space-y-2">
          <div className="h-10 bg-muted animate-pulse rounded-lg w-64" />
          <div className="h-5 bg-muted animate-pulse rounded w-48" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-32 bg-muted animate-pulse rounded-lg" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="h-64 bg-muted animate-pulse rounded-lg" />
          <div className="h-64 bg-muted animate-pulse rounded-lg" />
        </div>
      </div>
    );
  }
  
  return (
    <div className={`space-y-8 transition-all duration-500 ${loaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
      <div className="space-y-2">
        <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
          My Dashboard
        </h1>
        <p className="text-muted-foreground">Track your shifts and working hours</p>
      </div>
      
      <div className="grid grid-cols-1 gap-6">
        {/* Unique Promoter Code Card */}
        {user?.unique_code && (
          <Card className="transition-all duration-500 shadow-md border-primary/20 hover:shadow-lg bg-gradient-to-br from-primary/10 via-background to-secondary/10">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg font-semibold flex items-center gap-2">
                <Award className="h-5 w-5 text-primary" />
                Your Unique Promoter Code
              </CardTitle>
              <CardDescription>Use this code when companies assign you to shifts</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-3 p-4 bg-muted/50 rounded-lg border border-border/50">
                <code className="flex-1 text-2xl font-mono font-bold text-primary tracking-wider">
                  {user.unique_code}
                </code>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={handleCopyCode}
                  className="shrink-0"
                >
                  {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground mt-3">
                Companies can use this code to quickly find and assign you to shifts
              </p>
            </CardContent>
          </Card>
        )}
        
        {/* Stats cards with staggered animation */}
        <DashboardStats 
          upcomingShifts={upcomingShifts}
          nextShift={nextShift}
          completedShifts={completedShifts}
          totalEarned={totalEarned}
          unpaidAmount={unpaidAmount}
        />
        
        {/* Approved Work Section - Ready for Certificates */}
        {approvedShiftsCount > 0 && (
          <Card className="bg-gradient-to-r from-green-500/10 to-primary/10 border-green-500/20">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-lg">
                <CheckCircle className="h-5 w-5 text-green-500" />
                Approved Work
              </CardTitle>
              <CardDescription>
                You have {approvedShiftsCount} approved shift{approvedShiftsCount !== 1 ? 's' : ''} ready for certification
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button onClick={() => navigate("/certificates")} className="w-full md:w-auto">
                <Award className="mr-2 h-4 w-4" />
                Generate Certificate
              </Button>
            </CardContent>
          </Card>
        )}
        
        {/* Certificate generation card */}
        <Card className="transition-all duration-500 delay-50 shadow-sm border-border/50 hover:shadow-md bg-gradient-to-r from-secondary/20 to-background">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-semibold flex items-center gap-2">
              <Award className="h-5 w-5 text-primary" />
              Work Certificates
            </CardTitle>
            <CardDescription>
              Generate professional work certificates from your approved shifts
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm mb-4">
              Create official certificates showing your completed work hours from all companies.
              Perfect for including with job applications!
            </p>
            <Button 
              onClick={() => navigate("/certificates")}
              className="w-full md:w-auto"
            >
              <Award className="mr-2 h-4 w-4" />
              View Certificates
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
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-medium text-sm">{shift.title}</h3>
                        {approvedShiftIds.has(shift.id) && (
                          <Badge variant="outline" className="text-xs bg-green-500/10 text-green-600 border-green-500/20">
                            <CheckCircle className="h-2.5 w-2.5 mr-1" />
                            Approved
                          </Badge>
                        )}
                      </div>
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
