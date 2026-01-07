import { useEffect, useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { FileText } from "lucide-react";
import { generateContractTemplate } from "@/components/shifts/form/utils/contractTemplateGenerator";
import { Shift } from "../types/ShiftTypes";

type ShiftContractEditorProps = {
  shiftId: string;
  companyId: string;
  shift?: Shift;
  onUpdate?: () => void;
};

export function ShiftContractEditor({ shiftId, companyId, shift, onUpdate }: ShiftContractEditorProps) {
  const [loading, setLoading] = useState(true);
  const [shiftDetails, setShiftDetails] = useState<any>(null);
  const [companyName, setCompanyName] = useState<string>("Company");
  const [assignedPromotersCount, setAssignedPromotersCount] = useState(0);
  const [totalEstimatedPay, setTotalEstimatedPay] = useState(0);

  useEffect(() => {
    loadShiftDetails();
  }, [shiftId, companyId]);

  const loadShiftDetails = async () => {
    if (!shiftId || !companyId) return;
    
    try {
      setLoading(true);
      // Fetch shift details
      const { data: shiftData, error: shiftError } = await supabase
        .from("shifts")
        .select("*")
        .eq("id", shiftId)
        .single();

      if (shiftError) throw shiftError;
      
      if (shiftData) {
        setShiftDetails(shiftData);
        
        // Calculate assigned promoters count and total estimated pay
        const { data: assignments } = await supabase
          .from("shift_assignments")
          .select("id")
          .eq("shift_id", shiftId);
        
        const count = assignments?.length || 0;
        setAssignedPromotersCount(count);
        
        // Calculate total estimated pay based on shift duration and pay rate
        if (shiftData.date && shiftData.end_date && shiftData.start_time && shiftData.end_time) {
          const startDate = new Date(shiftData.date);
          const endDate = new Date(shiftData.end_date);
          const daysDiff = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;
          
          // Parse time strings (HH:mm format)
          const [startHour, startMin] = shiftData.start_time.split(':').map(Number);
          const [endHour, endMin] = shiftData.end_time.split(':').map(Number);
          const startMinutes = startHour * 60 + startMin;
          const endMinutes = endHour * 60 + endMin;
          const hoursPerDay = (endMinutes - startMinutes) / 60;
          
          const payRate = shiftData.pay_rate || 0;
          const payRateType = shiftData.pay_rate_type || "hourly";
          
          let totalPay = 0;
          if (payRateType === "hourly") {
            totalPay = payRate * hoursPerDay * daysDiff * count;
          } else if (payRateType === "daily") {
            totalPay = payRate * daysDiff * count;
          } else if (payRateType === "fixed") {
            totalPay = payRate * count;
          }
          
          setTotalEstimatedPay(totalPay);
        }
      }
      
      // Fetch company name
      try {
        const { data: companyProfile } = await supabase
          .from("company_profiles")
          .select("name")
          .eq("user_id", companyId)
          .single();
        
        if (companyProfile?.name) {
          setCompanyName(companyProfile.name);
        } else {
          // Fallback: fetch from profiles table
          const { data: userProfile } = await supabase
            .from("profiles")
            .select("full_name")
            .eq("id", companyId)
            .single();
          
          if (userProfile?.full_name) {
            setCompanyName(userProfile.full_name);
          }
        }
      } catch (error) {
        console.error("Error fetching company name:", error);
      }
    } catch (e: any) {
      console.error("Error loading shift details:", e);
    } finally {
      setLoading(false);
    }
  };

  const detailedContractPreview = useMemo(() => {
    if (!shiftDetails) return "";
    
    const startDate = shiftDetails.date ? new Date(shiftDetails.date) : new Date();
    const endDate = shiftDetails.end_date ? new Date(shiftDetails.end_date) : startDate;
    // Use end_date as payment date (or add 7 days after end date as default)
    const paymentDate = endDate ? new Date(endDate.getTime() + 7 * 24 * 60 * 60 * 1000) : new Date();
    
    return generateContractTemplate({
      shiftTitle: shiftDetails.title || "Shift Contract",
      description: shiftDetails.description || "",
      location: shiftDetails.location || "",
      startDate,
      endDate,
      startTime: shiftDetails.start_time || "09:00",
      endTime: shiftDetails.end_time || "17:00",
      payRate: shiftDetails.pay_rate || 0,
      payRateType: (shiftDetails.pay_rate_type as "hourly" | "daily" | "fixed") || "hourly",
      paymentDate,
      promoterCount: assignedPromotersCount,
      totalEstimatedPay,
      companyName,
      companyId
    });
  }, [shiftDetails, assignedPromotersCount, totalEstimatedPay, companyName, companyId]);


  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Shift Contract
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-sm text-muted-foreground">Loading contract...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          Shift Contract
        </CardTitle>
        <CardDescription>
          View the detailed contract for this shift. This contract will be shown to promoters when they accept the shift assignment.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {loading ? (
          <div className="text-center py-8 text-muted-foreground">Loading contract details...</div>
        ) : shiftDetails ? (
          <div className="border border-gray-200 rounded-lg overflow-hidden bg-white">
            <div className="bg-gray-100 p-4 border-b border-gray-200">
              <h3 className="font-semibold text-gray-700">Contract Preview</h3>
            </div>
            <div className="overflow-auto h-[600px]">
              <iframe
                srcDoc={detailedContractPreview}
                title="Detailed Contract Preview"
                className="w-full h-full border-none"
                style={{ minHeight: "600px" }}
              />
            </div>
          </div>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            Shift details not available. Please ensure the shift has been created with all required information.
          </div>
        )}
      </CardContent>
    </Card>
  );
}

