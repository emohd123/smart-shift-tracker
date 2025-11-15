import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import AppLayout from "@/components/layout/AppLayout";
import { ShiftForm } from "@/components/shifts/ShiftForm";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Shift } from "@/components/shifts/types/ShiftTypes";
import { ShiftStatus } from "@/types/database";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

const EditShift = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuth();
  const [shift, setShift] = useState<Shift | null>(null);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    if (!isAuthenticated) {
      navigate("/login");
      return;
    }
    
    if (!(user?.role === "admin" || user?.role === "company")) {
      toast.error("Permission Denied");
      navigate("/shifts");
      return;
    }
    
    loadShift();
  }, [isAuthenticated, user, id]);
  
  const loadShift = async () => {
    if (!id) return;
    
    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from('shifts')
        .select('*')
        .eq('id', id)
        .single();
      
      if (error) throw error;
      
      // Check if user owns this shift (for companies)
      if (user?.role === "company" && data.company_id !== user?.id) {
        toast.error("You don't have permission to edit this shift");
        navigate("/shifts");
        return;
      }
      
      // Format database data to Shift type
      const formattedShift: Shift = {
        id: data.id,
        title: data.title,
        date: data.date,
        endDate: data.end_date,
        startTime: data.start_time,
        endTime: data.end_time,
        location: data.location || "",
        status: data.status as ShiftStatus,
        payRate: data.pay_rate || 0,
        payRateType: data.pay_rate_type,
        isPaid: data.is_paid || false,
        manual_status_override: data.manual_status_override,
        override_status: data.override_status
      };
      
      setShift(formattedShift);
    } catch (error: any) {
      console.error("Error loading shift:", error);
      toast.error("Failed to load shift");
      navigate("/shifts");
    } finally {
      setLoading(false);
    }
  };

  if (!isAuthenticated || !(user?.role === "admin" || user?.role === "company")) {
    return null;
  }
  
  if (loading) {
    return (
      <AppLayout title="Edit Shift">
        <div className="max-w-4xl mx-auto">
          <Card>
            <CardHeader>
              <Skeleton className="h-8 w-48" />
            </CardHeader>
            <CardContent className="space-y-4">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-24 w-full" />
            </CardContent>
          </Card>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout title="Edit Shift">
      <div className="max-w-4xl mx-auto">
        {shift ? (
          <ShiftForm shift={shift} />
        ) : (
          <Card>
            <CardContent className="p-8 text-center">
              <p className="text-muted-foreground">Shift not found</p>
            </CardContent>
          </Card>
        )}
      </div>
    </AppLayout>
  );
};

export default EditShift;
