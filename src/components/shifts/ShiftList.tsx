
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PlusCircle, Search, Trash2, RefreshCw } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/context/AuthContext";
import ShiftGrid from "./ShiftGrid";
import { Shift } from "./types/ShiftTypes";
import { toast } from "sonner";

interface ShiftListProps {
  shifts: Shift[];
  title?: string;
  deleteShift?: (id: string) => void;
  refreshShifts?: () => void;
}

const ShiftList = ({ shifts, title = "Shifts", deleteShift, refreshShifts }: ShiftListProps) => {
  const navigate = useNavigate();
  const { toast } = useToast();
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
      toast({
        title: "Data Refreshed",
        description: "The shifts list has been updated with the latest data"
      });
    } catch (error) {
      console.error("Error refreshing data:", error);
      toast({
        title: "Refresh Failed",
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
        toast({
          title: "Success",
          description: `${successful} shift${successful > 1 ? 's' : ''} deleted successfully`
        });
        
        // Refresh the data to ensure UI is in sync with database
        if (refreshShifts) {
          await refreshShifts();
        }
      }
      
      if (successful < selectedShifts.length) {
        toast({
          title: "Warning",
          description: `${selectedShifts.length - successful} shift(s) could not be deleted`,
          variant: "destructive"
        });
      }
      
      // Clear selection
      setSelectedShifts([]);
      
    } catch (error) {
      console.error("Error in bulk delete operation:", error);
      toast({
        title: "Error",
        description: "Failed to complete delete operation",
        variant: "destructive"
      });
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">{title}</h2>
        
        <div className="flex gap-2">
          {refreshShifts && (
            <Button 
              variant="outline" 
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="gap-1"
            >
              <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
              {isRefreshing ? 'Refreshing...' : 'Refresh'}
            </Button>
          )}
          
          {isAdmin && (
            <Button onClick={() => navigate("/create-shift")}>
              <PlusCircle className="mr-2 h-4 w-4" />
              Create Shift
            </Button>
          )}
        </div>
      </div>
      
      <div className="flex gap-4 items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="Search shifts..."
            className="pl-10"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        {isAdmin && selectedShifts.length > 0 && (
          <Button 
            variant="destructive" 
            onClick={handleBulkDelete}
            disabled={isDeleting}
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Delete ({selectedShifts.length})
          </Button>
        )}
      </div>
      
      {filteredShifts.length === 0 ? (
        <div className="text-center p-8 border rounded-lg bg-muted/20">
          <p className="text-muted-foreground">No shifts found</p>
        </div>
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
