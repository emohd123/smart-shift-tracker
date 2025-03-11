
import { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import AppLayout from "@/components/layout/AppLayout";
import ShiftDetail from "@/components/shifts/ShiftDetail";
import { Shift } from "@/components/shifts/ShiftCard";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import TimeTracker from "@/components/time/TimeTracker";

// Import mock shifts data
import { mockShifts } from "./Shifts";

declare global {
  interface Window {
    deleteShift: (id: string) => void;
    startTimeTracking?: (shift: Shift) => void;
  }
}

const ShiftDetails = () => {
  const { id } = useParams<{ id: string }>();
  const { toast } = useToast();
  const { isAuthenticated, user } = useAuth();
  const navigate = useNavigate();
  const [shift, setShift] = useState<Shift | null>(null);
  const [loading, setLoading] = useState(true);
  const [isCheckedIn, setIsCheckedIn] = useState(false);
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const timeTrackerRef = useRef<{ 
    handleStartTracking: () => void;
    handleStopTracking: () => void;
  } | null>(null);

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!isAuthenticated) {
      navigate("/login");
    }
  }, [isAuthenticated, navigate]);

  useEffect(() => {
    // Simulate API request
    setLoading(true);
    const timer = setTimeout(() => {
      const foundShift = mockShifts.find(s => s.id === id);
      if (foundShift) {
        setShift(foundShift);
        // If the shift is already ongoing, mark as checked in
        setIsCheckedIn(foundShift.status === "ongoing");
      }
      setLoading(false);
    }, 500);
    
    return () => clearTimeout(timer);
  }, [id]);

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

  if (!isAuthenticated) {
    return null; // Don't render anything while redirecting
  }

  const handleCheckIn = async () => {
    if (shift) {
      // Simulate API update
      const updatedShift = { ...shift, status: "ongoing" as const };
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
      try {
        // This is just for demonstration - in a real app, you would update
        // the check-in status in the database
        console.log("Updating shift status to ongoing:", shift.id);
      } catch (error) {
        console.error("Error updating shift status:", error);
      }
    }
  };

  const handleCheckOut = async () => {
    if (shift) {
      setIsCheckingOut(true);
      
      // Stop time tracking first
      if (timeTrackerRef.current) {
        timeTrackerRef.current.handleStopTracking();
      }
      
      // Simulate API update
      const updatedShift = { ...shift, status: "completed" as const };
      setShift(updatedShift);
      setIsCheckedIn(false);
      
      toast({
        title: "Checked Out",
        description: "You have successfully checked out from this shift",
      });
      
      // In a real app, you'd update the database here
      try {
        // This is just for demonstration - in a real app, you would update
        // the check-out status in the database
        console.log("Updating shift status to completed:", shift.id);
      } catch (error) {
        console.error("Error updating shift status:", error);
      } finally {
        setIsCheckingOut(false);
      }
    }
  };

  const handleDelete = (shiftId: string) => {
    // Check if user has permission (admin only)
    if (user?.role !== "admin") {
      toast({
        title: "Permission Denied",
        description: "Only admin users can delete shifts",
        variant: "destructive"
      });
      return;
    }
    
    // Call the global deleteShift function to remove from the main list
    if (window.deleteShift) {
      window.deleteShift(shiftId);
    }
    
    // In a real app, you'd also delete any associated locations
    try {
      // This is just for demonstration - in a real app, you would delete
      // the associated location data from the database
      console.log("Deleting shift location data for:", shiftId);
    } catch (error) {
      console.error("Error deleting shift location:", error);
    }
  };

  return (
    <AppLayout title="Shift Details">
      {loading ? (
        <div className="max-w-3xl mx-auto space-y-6">
          <Skeleton className="h-8 w-32" />
          <Skeleton className="h-64 w-full" />
        </div>
      ) : shift ? (
        <div className="space-y-6">
          <ShiftDetail 
            shift={shift} 
            onCheckIn={handleCheckIn} 
            onCheckOut={handleCheckOut} 
            onDelete={handleDelete}
          />
          
          {isCheckedIn && (
            <TimeTracker 
              shift={shift}
              onCheckIn={handleCheckIn}
              onCheckOut={handleCheckOut}
              ref={timeTrackerRef}
              autoStop={isCheckingOut}
            />
          )}
        </div>
      ) : (
        <div className="max-w-3xl mx-auto text-center py-12">
          <h2 className="text-2xl font-bold mb-2">Shift Not Found</h2>
          <p className="text-muted-foreground">
            The shift you're looking for doesn't exist or has been removed.
          </p>
        </div>
      )}
    </AppLayout>
  );
};

export default ShiftDetails;
