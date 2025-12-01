import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
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
  const [selectedShifts, setSelectedShifts] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);

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

  const handleApproveShift = async (shiftId: string) => {
    setProcessing(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const shift = shifts.find(s => s.id === shiftId);
      if (!shift) return;

      // Approve all promoters in this shift
      const { error } = await supabase
        .from('shift_assignments')
        .update({
          certificate_approved: true,
          approved_at: new Date().toISOString(),
          approved_by: user.id
        })
        .eq('shift_id', shiftId);

      if (error) throw error;

      // Create notifications for each promoter
      const notificationPromises = shift.promoters
        .filter(p => !p.approved)
        .map(promoter => 
          supabase.from('notifications').insert({
            user_id: promoter.promoterId,
            title: 'Shift Approved for Certificate',
            message: `Your work on "${shift.title}" (${format(new Date(shift.date), 'MMM dd, yyyy')}) has been approved. You can now generate a work certificate.`,
            type: 'certificate_approval',
            read: false
          })
        );
      
      await Promise.all(notificationPromises);

      toast.success(`Approved ${shift.promoters.length} promoter(s) for certificates`);
      fetchCompletedShifts();
    } catch (error) {
      console.error('Error approving shift:', error);
      toast.error('Failed to approve shift');
    } finally {
      setProcessing(false);
    }
  };

  const handleBulkApprove = async () => {
    if (selectedShifts.length === 0) {
      toast.error('Please select shifts to approve');
      return;
    }

    setProcessing(true);
    try {
      for (const shiftId of selectedShifts) {
        await handleApproveShift(shiftId);
      }
      setSelectedShifts([]);
      toast.success(`Bulk approved ${selectedShifts.length} shift(s)`);
    } catch (error) {
      console.error('Error in bulk approval:', error);
      toast.error('Failed to complete bulk approval');
    } finally {
      setProcessing(false);
    }
  };

  const toggleShiftSelection = (shiftId: string) => {
    setSelectedShifts(prev => 
      prev.includes(shiftId) 
        ? prev.filter(id => id !== shiftId)
        : [...prev, shiftId]
    );
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Shift Approvals</CardTitle>
          <CardDescription>Loading completed shifts...</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-primary" />
              Shift Approvals
            </CardTitle>
            <CardDescription>
              Approve completed shifts so promoters can generate certificates
            </CardDescription>
          </div>
          {selectedShifts.length > 0 && (
            <Button onClick={handleBulkApprove} disabled={processing}>
              Approve Selected ({selectedShifts.length})
            </Button>
          )}
        </div>
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
              const approvedCount = shift.promoters.filter(p => p.approved).length;

              return (
                <div key={shift.id} className="border rounded-lg p-4 space-y-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3">
                      <Checkbox
                        checked={selectedShifts.includes(shift.id)}
                        onCheckedChange={() => toggleShiftSelection(shift.id)}
                        disabled={allApproved}
                      />
                      <div>
                        <h3 className="font-semibold">{shift.title}</h3>
                        <p className="text-sm text-muted-foreground">
                          {format(new Date(shift.date), 'MMM dd, yyyy')} • {shift.startTime} - {shift.endTime}
                        </p>
                        <p className="text-xs text-muted-foreground">{shift.location}</p>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      {allApproved ? (
                        <Badge variant="outline" className="bg-green-500/10 text-green-600 border-green-500/20">
                          <CheckCircle className="h-3 w-3 mr-1" />
                          All Approved
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="bg-orange-500/10 text-orange-600 border-orange-500/20">
                          <Clock className="h-3 w-3 mr-1" />
                          Pending ({approvedCount}/{shift.promoters.length})
                        </Badge>
                      )}
                    </div>
                  </div>

                  <div className="pl-9">
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
                            <Badge variant="outline" className="text-xs">
                              Pending
                            </Badge>
                          )}
                        </div>
                      ))}
                    </div>

                    {!allApproved && (
                      <Button 
                        onClick={() => handleApproveShift(shift.id)}
                        disabled={processing}
                        className="mt-3"
                        size="sm"
                      >
                        Approve All Promoters
                      </Button>
                    )}
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
