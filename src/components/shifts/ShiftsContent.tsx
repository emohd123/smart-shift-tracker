
import { useEffect } from "react";
import { Shift } from "@/components/shifts/ShiftCard";
import ShiftList from "@/components/shifts/ShiftList";
import { ShiftsLoading } from "@/components/shifts/ShiftsLoading";

// Define global functions for TypeScript
declare global {
  interface Window {
    deleteShift?: (id: string) => void;
    startTimeTracking?: (shift: Shift) => void;
  }
}

interface ShiftsContentProps {
  shifts: Shift[];
  loading: boolean;
  title: string;
  deleteShift: (id: string) => void;
}

export const ShiftsContent = ({ shifts, loading, title, deleteShift }: ShiftsContentProps) => {
  // Register the deleteShift function globally, but clean up on unmount
  useEffect(() => {
    window.deleteShift = deleteShift;
    
    return () => {
      window.deleteShift = undefined;
    };
  }, [deleteShift]);
  
  if (loading) {
    return <ShiftsLoading />;
  }
  
  if (shifts.length === 0) {
    return (
      <div className="p-8 text-center">
        <h2 className="text-xl font-medium text-muted-foreground">No shifts found</h2>
        <p className="mt-2 text-muted-foreground">When shifts are created, they will appear here.</p>
      </div>
    );
  }
  
  return (
    <ShiftList 
      shifts={shifts} 
      title={title} 
    />
  );
};
