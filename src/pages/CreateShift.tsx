import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { v4 as uuidv4 } from "uuid";
import AppLayout from "@/components/layout/AppLayout";
import { ShiftForm } from "@/components/shifts/form/ShiftForm";
import { useShiftsData } from "@/hooks/shifts/useShiftsData";
import { useAuth } from "@/context/AuthContext";
import { ShiftFormData } from "@/components/shifts/types/ShiftTypes";
import { format } from "date-fns";
import { toast } from "sonner";
import { ShiftStatus } from "@/types/database";

const CreateShift = () => {
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuth();
  const { addShift } = useShiftsData({
    userId: user?.id,
    userRole: user?.role,
    isAuthenticated
  });
  
  useEffect(() => {
    if (!isAuthenticated) {
      navigate("/login");
      return;
    }
    
    if (user?.role !== "admin") {
      toast.error("Permission Denied", {
        description: "Only admin users can create shifts"
      });
      navigate("/shifts");
    }
  }, [isAuthenticated, navigate, user]);

  const handleFormSubmit = (data: ShiftFormData) => {
    if (!isAuthenticated || !window.addShift) return;
    
    const shiftDate = data.dateRange?.from 
      ? format(data.dateRange.from, 'yyyy-MM-dd') 
      : format(new Date(), 'yyyy-MM-dd');
    
    const endDate = data.dateRange?.to 
      ? format(data.dateRange.to, 'yyyy-MM-dd') 
      : undefined;
      
    const newShift = {
      id: uuidv4(),
      title: data.title,
      date: shiftDate,
      endDate: endDate,
      startTime: data.startTime,
      endTime: data.endTime,
      location: data.location,
      status: ShiftStatus.Upcoming,
      payRate: parseFloat(data.payRate),
      payRateType: data.payRateType,
      isPaid: false,
      assigned_promoters: data.selectedPromoterIds.length,
    };
    
    window.addShift(newShift);
    
    toast.success("Shift Created", {
      description: "The shift has been successfully created"
    });
    navigate("/shifts");
  };

  if (!isAuthenticated || user?.role !== "admin") {
    return null;
  }

  return (
    <AppLayout title="Create Shift">
      <div className="max-w-4xl mx-auto">
        <ShiftForm onSubmit={handleFormSubmit} />
      </div>
    </AppLayout>
  );
};

export default CreateShift;
