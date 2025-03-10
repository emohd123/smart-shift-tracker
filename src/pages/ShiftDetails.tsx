
import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import AppLayout from "@/components/layout/AppLayout";
import ShiftDetail from "@/components/shifts/ShiftDetail";
import { Shift } from "@/components/shifts/ShiftCard";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/context/AuthContext";

// Import mock shifts data
import { mockShifts } from "./Shifts";

declare global {
  interface Window {
    deleteShift: (id: string) => void;
  }
}

const ShiftDetails = () => {
  const { id } = useParams<{ id: string }>();
  const { toast } = useToast();
  const { isAuthenticated, user } = useAuth();
  const navigate = useNavigate();
  const [shift, setShift] = useState<Shift | null>(null);
  const [loading, setLoading] = useState(true);

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
      }
      setLoading(false);
    }, 500);
    
    return () => clearTimeout(timer);
  }, [id]);

  if (!isAuthenticated) {
    return null; // Don't render anything while redirecting
  }

  const handleCheckIn = () => {
    if (shift) {
      // Simulate API update
      const updatedShift = { ...shift, status: "ongoing" as const };
      setShift(updatedShift);
      toast({
        title: "Checked In",
        description: "You have successfully checked in for this shift",
      });
    }
  };

  const handleCheckOut = () => {
    if (shift) {
      // Simulate API update
      const updatedShift = { ...shift, status: "completed" as const };
      setShift(updatedShift);
      toast({
        title: "Checked Out",
        description: "You have successfully checked out from this shift",
      });
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
  };

  return (
    <AppLayout title="Shift Details">
      {loading ? (
        <div className="max-w-3xl mx-auto space-y-6">
          <Skeleton className="h-8 w-32" />
          <Skeleton className="h-64 w-full" />
        </div>
      ) : shift ? (
        <ShiftDetail 
          shift={shift} 
          onCheckIn={handleCheckIn} 
          onCheckOut={handleCheckOut} 
          onDelete={handleDelete}
        />
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
