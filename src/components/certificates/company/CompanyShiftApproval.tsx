import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, Clock, Users } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { getEffectiveStatus } from "@/components/shifts/utils/statusCalculations";

interface ShiftWithPromoters {
  id: string;
  title: string;
  date: string;
  startTime: string;
  endTime: string;
  location: string;
  promoters: {
    id: string;
    promoterId: string;
    promoterName: string;
    approved: boolean;
    approvedAt: string | null;
  }[];
}

export default function CompanyShiftApproval() {
  const [shifts, setShifts] = useState<ShiftWithPromoters[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCompletedShifts();
  }, []);

  const fetchCompletedShifts = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Fetch completed shifts for this company
      const { data: shiftsData, error: shiftsError } = await supabase
        .from('shifts')
        .select('id, title, date, start_time, end_time, location, status, manual_status_override, override_status')
        .eq('company_id', user.id)
        .order('date', { ascending: false });

      if (shiftsError) throw shiftsError;

      // Filter for completed shifts
      const completedShifts = shiftsData?.filter(shift => 
        getEffectiveStatus(shift as any) === 'completed'
      ) || [];

      // Fetch promoters for each shift
      const shiftsWithPromoters = await Promise.all(
        completedShifts.map(async (shift) => {
          const { data: assignments } = await supabase
            .from('shift_assignments')
            .select(`
              id,
              promoter_id,
              certificate_approved,
              approved_at,
              profiles:promoter_id (full_name)
            `)
            .eq('shift_id', shift.id);

          return {
            id: shift.id,
            title: shift.title,
            date: shift.date,
            startTime: shift.start_time,
            endTime: shift.end_time,
            location: shift.location || 'N/A',
            promoters: assignments?.map(a => ({
              id: a.id,
              promoterId: a.promoter_id,
              promoterName: (a.profiles as any)?.full_name || 'Unknown',
              approved: a.certificate_approved || false,
              approvedAt: a.approved_at
            })) || []
          };
        })
      );

      setShifts(shiftsWithPromoters);
    } catch (error) {
      console.error('Error fetching shifts:', error);
      toast.error('Failed to load shifts');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Shift Approval Status</CardTitle>
          <CardDescription>Loading completed shifts...</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CheckCircle className="h-5 w-5 text-primary" />
          Shift Approval Status
        </CardTitle>
        <CardDescription>
          Completed shifts are automatically approved for certificate generation
        </CardDescription>
      </CardHeader>
      <CardContent>
        {shifts.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Clock className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No completed shifts found</p>
          </div>
        ) : (
          <div className="space-y-4">
            {shifts.map((shift) => {
              const allApproved = shift.promoters.every(p => p.approved);

              return (
                <div key={shift.id} className="border rounded-lg p-4 space-y-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-semibold">{shift.title}</h3>
                      <p className="text-sm text-muted-foreground">
                        {format(new Date(shift.date), 'MMM dd, yyyy')} • {shift.startTime} - {shift.endTime}
                      </p>
                      <p className="text-xs text-muted-foreground">{shift.location}</p>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      {allApproved ? (
                        <Badge variant="outline" className="bg-green-500/10 text-green-600 border-green-500/20">
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Auto-Approved
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="bg-blue-500/10 text-blue-600 border-blue-500/20">
                          <Clock className="h-3 w-3 mr-1" />
                          Pending Auto-Approval
                        </Badge>
                      )}
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                      <Users className="h-4 w-4" />
                      <span>{shift.promoters.length} Promoter(s)</span>
                    </div>
                    
                    <div className="space-y-1">
                      {shift.promoters.map(promoter => (
                        <div key={promoter.id} className="flex items-center justify-between text-sm">
                          <span>{promoter.promoterName}</span>
                          {promoter.approved ? (
                            <Badge variant="outline" className="text-xs bg-green-500/10 text-green-600 border-green-500/20">
                              Approved
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="text-xs bg-blue-500/10 text-blue-600 border-blue-500/20">
                              Pending
                            </Badge>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
