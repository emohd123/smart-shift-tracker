
import { useEffect } from "react";
import { Shift } from "./types/ShiftTypes";
import ShiftList from "./ShiftList";
import { ShiftsLoading } from "./ShiftsLoading";
import { motion } from "framer-motion";
import { Calendar, AlertCircle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

// Define global functions for TypeScript
declare global {
  interface Window {
    deleteShift?: (id: string) => void;
    startTimeTracking?: (shift: Shift) => void;
    addShift?: (shift: Shift) => void;
    refreshShifts?: () => void;
  }
}

interface ShiftsContentProps {
  shifts: Shift[];
  loading: boolean;
  title: string;
  deleteShift: (id: string) => void;
  refreshShifts?: () => void;
}

export const ShiftsContent = ({ 
  shifts, 
  loading, 
  title, 
  deleteShift, 
  refreshShifts 
}: ShiftsContentProps) => {
  const navigate = useNavigate();
  
  // Register the deleteShift function globally, but clean up on unmount
  useEffect(() => {
    console.log("Setting deleteShift function globally");
    window.deleteShift = deleteShift;
    
    return () => {
      window.deleteShift = undefined;
    };
  }, [deleteShift]);
  
  const handleRefresh = () => {
    if (refreshShifts) {
      refreshShifts();
    }
  };
  
  if (loading) {
    return <ShiftsLoading />;
  }
  
  if (shifts.length === 0) {
    return (
      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="flex flex-col items-center justify-center py-16 text-center"
      >
        <div className="bg-secondary/50 p-6 rounded-full mb-6">
          <Calendar className="h-12 w-12 text-muted-foreground" />
        </div>
        <h2 className="text-2xl font-semibold mb-2">No shifts found</h2>
        <p className="text-muted-foreground mb-8 max-w-md">
          When shifts are created, they will appear here. Check back later or create a new shift.
        </p>
        <div className="flex gap-4">
          <Button 
            onClick={() => navigate("/create-shift")}
            className="gap-2"
          >
            <Calendar className="h-4 w-4" />
            Create New Shift
          </Button>
          
          {refreshShifts && (
            <Button 
              variant="outline" 
              onClick={handleRefresh}
              className="gap-2"
            >
              <RefreshCw className="h-4 w-4" />
              Refresh Data
            </Button>
          )}
        </div>
      </motion.div>
    );
  }
  
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4 }}
    >
      <ShiftList 
        shifts={shifts} 
        title={title}
        deleteShift={deleteShift}
        refreshShifts={refreshShifts}
      />
    </motion.div>
  );
};
