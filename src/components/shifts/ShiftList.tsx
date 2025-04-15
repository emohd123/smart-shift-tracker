
import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { Shift } from "./types/ShiftTypes";
import { toast } from "sonner";
import ShiftGrid from "./ShiftGrid";
import SearchBar from "./list/SearchBar";
import ShiftListHeader from "./list/ShiftListHeader";
import BulkDeleteButton from "./list/BulkDeleteButton";
import EmptyShifts from "./list/EmptyShifts";

interface ShiftListProps {
  shifts: Shift[];
  title?: string;
  deleteShift?: (id: string) => void;
  refreshShifts?: () => void;
}

const ShiftList = ({ shifts, title = "Shifts", deleteShift, refreshShifts }: ShiftListProps) => {
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedShifts, setSelectedShifts] = useState<string[]>([]);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  const isAdmin = user?.role === "admin";
  
  // Filter shifts based on search term
  const filteredShifts = shifts.filter(shift => 
    shift.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    shift.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
    shift.date.includes(searchTerm)
  );
  
  // Handle shift selection for bulk actions
  const handleSelectShift = (shiftId: string) => {
    setSelectedShifts(prev => 
      prev.includes(shiftId) 
        ? prev.filter(id => id !== shiftId)
        : [...prev, shiftId]
    );
  };
  
  // Handle manual refresh of shift data
  const handleRefresh = async () => {
    if (!refreshShifts) return;
    
    setIsRefreshing(true);
    
    try {
      await refreshShifts();
      toast("Data Refreshed", {
        description: "The shifts list has been updated with the latest data"
      });
    } catch (error) {
      console.error("Error refreshing data:", error);
      toast("Refresh Failed", {
        description: "Could not refresh data. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsRefreshing(false);
    }
  };
  
  // Handle bulk delete
  const handleBulkDelete = async () => {
    if (selectedShifts.length === 0) return;
    
    setIsDeleting(true);
    
    try {
      console.log("Selected shifts for deletion:", selectedShifts);
      
      // Process deletions one by one to handle errors individually
      const deletePromises = selectedShifts.map(async (id) => {
        try {
          console.log("Deleting shift:", id);
          
          if (deleteShift) {
            await deleteShift(id);
            return { id, success: true };
          } else if (window.deleteShift) {
            window.deleteShift(id);
            return { id, success: true };
          }
          return { id, success: false, error: "No delete function available" };
        } catch (error) {
          console.error(`Error deleting shift ${id}:`, error);
          return { id, success: false, error };
        }
      });
      
      const results = await Promise.all(deletePromises);
      const successful = results.filter(r => r.success).length;
      
      if (successful > 0) {
        toast("Success", {
          description: `${successful} shift${successful > 1 ? 's' : ''} deleted successfully`
        });
        
        // Refresh the data to ensure UI is in sync with database
        if (refreshShifts) {
          await refreshShifts();
        }
      }
      
      if (successful < selectedShifts.length) {
        toast("Warning", {
          description: `${selectedShifts.length - successful} shift(s) could not be deleted`,
          variant: "destructive"
        });
      }
      
      // Clear selection
      setSelectedShifts([]);
      
    } catch (error) {
      console.error("Error in bulk delete operation:", error);
      toast("Error", {
        description: "Failed to complete delete operation",
        variant: "destructive"
      });
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-4">
      <ShiftListHeader 
        title={title}
        isAdmin={isAdmin}
        isRefreshing={isRefreshing}
        handleRefresh={handleRefresh}
        refreshShifts={refreshShifts}
      />
      
      <div className="flex gap-4 items-center">
        <SearchBar 
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
        />
        
        {isAdmin && (
          <BulkDeleteButton
            selectedCount={selectedShifts.length}
            isDeleting={isDeleting}
            onBulkDelete={handleBulkDelete}
          />
        )}
      </div>
      
      {filteredShifts.length === 0 ? (
        <EmptyShifts />
      ) : (
        <ShiftGrid 
          shifts={filteredShifts} 
          selectedShifts={isAdmin ? selectedShifts : undefined}
          onSelectShift={isAdmin ? handleSelectShift : undefined}
        />
      )}
    </div>
  );
};

export default ShiftList;
