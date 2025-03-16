
import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Shift } from "@/components/shifts/ShiftCard";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/context/AuthContext";
import { mockShifts } from "@/utils/mockData";
import { ShiftStatus } from "@/types/database";

type TimeTrackerRef = {
  handleStartTracking: () => void;
  handleStopTracking: () => void;
} | null;

export function useShiftDetail(shiftId: string | undefined) {
  const { toast } = useToast();
  const { isAuthenticated, user } = useAuth();
  const navigate = useNavigate();
  const [shift, setShift] = useState<Shift | null>(null);
  const [loading, setLoading] = useState(true);
  const [isCheckedIn, setIsCheckedIn] = useState(false);
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const timeTrackerRef = useRef<TimeTrackerRef>(null);

  // Load shift data
  useEffect(() => {
    if (!shiftId) {
      setLoading(false);
      return;
    }
    
    // Simulate API request
    setLoading(true);
    const timer = setTimeout(() => {
      const foundShift = mockShifts.find(s => s.id === shiftId);
      if (foundShift) {
        setShift(foundShift);
        // If the shift is already ongoing, mark as checked in
        setIsCheckedIn(foundShift.status === ShiftStatus.Ongoing);
      } else {
        // Handle case when shift is not found
        toast({
          title: "Shift Not Found",
          description: "The requested shift could not be found",
          variant: "destructive"
        });
      }
      setLoading(false);
    }, 500);
    
    return () => clearTimeout(timer);
  }, [shiftId, toast]);

  // Register global function to start time tracking
  useEffect(() => {
    window.startTimeTracking = (shiftData: Shift) => {
      if (timeTrackerRef.current) {
        timeTrackerRef.current.handleStartTracking();
      }
    };

    return () => {
      window.startTimeTracking = undefined;
    };
  }, []);

  const handleCheckIn = async () => {
    if (!shift) return;
    
    try {
      // Simulate API update - using proper ShiftStatus enum
      const updatedShift: Shift = { 
        ...shift, 
        status: ShiftStatus.Ongoing 
      };
      
      setShift(updatedShift);
      setIsCheckedIn(true);
      
      toast({
        title: "Checked In",
        description: "You have successfully checked in for this shift",
      });
      
      // Start time tracking automatically
      if (timeTrackerRef.current) {
        timeTrackerRef.current.handleStartTracking();
      }
      
      // In a real app, you'd update the database here
      console.log("Updating shift status to ongoing:", shift.id);
    } catch (error) {
      console.error("Error updating shift status:", error);
      toast({
        title: "Check-in Failed",
        description: "Could not check in for this shift. Please try again.",
        variant: "destructive"
      });
    }
  };

  const handleCheckOut = async () => {
    if (!shift) return;
    
    try {
      setIsCheckingOut(true);
      
      // Stop time tracking first
      if (timeTrackerRef.current) {
        timeTrackerRef.current.handleStopTracking();
      }
      
      // Simulate API update - using proper ShiftStatus enum
      const updatedShift: Shift = { 
        ...shift, 
        status: ShiftStatus.Completed 
      };
      
      setShift(updatedShift);
      setIsCheckedIn(false);
      
      toast({
        title: "Checked Out",
        description: "You have successfully checked out from this shift",
      });
      
      // In a real app, you'd update the database here
      console.log("Updating shift status to completed:", shift.id);
    } catch (error) {
      console.error("Error updating shift status:", error);
      toast({
        title: "Check-out Failed",
        description: "Could not check out from this shift. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsCheckingOut(false);
    }
  };

  const handleDelete = (shiftId: string) => {
    // Check if user has permission (admin only)
    if (!user || user.role !== "admin") {
      toast({
        title: "Permission Denied",
        description: "Only admin users can delete shifts",
        variant: "destructive"
      });
      return;
    }
    
    try {
      // Call the global deleteShift function to remove from the main list
      if (window.deleteShift) {
        window.deleteShift(shiftId);
        
        toast({
          title: "Shift Deleted",
          description: "The shift has been successfully deleted",
        });
        
        // Navigate back to shifts list
        navigate("/shifts");
      } else {
        throw new Error("Delete function not available");
      }
    } catch (error) {
      console.error("Error deleting shift:", error);
      toast({
        title: "Delete Failed",
        description: "Could not delete the shift. Please try again.",
        variant: "destructive"
      });
    }
  };

  return {
    isAuthenticated,
    shift,
    loading,
    isCheckedIn,
    isCheckingOut,
    timeTrackerRef,
    handleCheckIn,
    handleCheckOut,
    handleDelete,
    navigate
  };
}
