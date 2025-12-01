
import { useEffect } from "react";
import { Shift } from "./types/ShiftTypes";
import ShiftList from "./ShiftList";
import { ShiftsLoading } from "./ShiftsLoading";
import { motion } from "framer-motion";
import { Calendar, AlertCircle, RefreshCw, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";

// Define global functions for TypeScript
declare global {
  interface Window {
    deleteShift?: (id: string) => void;
    deleteAllShifts?: () => void;
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
  deleteAllShifts?: () => Promise<void>;
  refreshShifts?: () => Promise<void>;
}

export const ShiftsContent = ({ 
  shifts, 
  loading, 
  title, 
  deleteShift,
  deleteAllShifts,
  refreshShifts 
}: ShiftsContentProps) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";
  const isCompany = user?.role === "company";
  
  // Register the deleteShift function globally, but clean up on unmount
  useEffect(() => {
    console.log("Setting deleteShift function globally");
    window.deleteShift = deleteShift;
    
    if (deleteAllShifts) {
      window.deleteAllShifts = deleteAllShifts;
    }
    
    return () => {
      window.deleteShift = undefined;
      window.deleteAllShifts = undefined;
    };
  }, [deleteShift, deleteAllShifts]);
  
  const handleRefresh = async () => {
    if (refreshShifts) {
      try {
        toast.info("Refreshing shifts data...");
        await refreshShifts();
        toast.success("Data refreshed successfully");
      } catch (error) {
        toast.error("Failed to refresh data");
      }
    }
  };
  
  const handleDeleteAll = async () => {
    if (deleteAllShifts) {
      try {
        toast.info("Deleting all shifts...");
        await deleteAllShifts();
        toast.success("All shifts deleted successfully");
      } catch (error) {
        toast.error("Failed to delete shifts");
      }
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
          When shifts are created, they will appear here. You can create a new shift using the button below.
        </p>
        <div className="flex gap-4">
          {(isAdmin || isCompany) && (
            <Button 
              onClick={() => navigate("/shifts/create")}
              className="gap-2"
            >
              <Calendar className="h-4 w-4" />
              Create New Shift
            </Button>
          )}
          
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
        deleteAllShifts={isAdmin ? deleteAllShifts : undefined}
      />
    </motion.div>
  );
};
