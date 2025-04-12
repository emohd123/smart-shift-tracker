
// We need to add this component since there might be errors related to shift assignments
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PlusCircle, Search, Trash2 } from "lucide-react";
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
}

const ShiftList = ({ shifts, title = "Shifts", deleteShift }: ShiftListProps) => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedShifts, setSelectedShifts] = useState<string[]>([]);
  const [isDeleting, setIsDeleting] = useState(false);
  
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
  
  // Handle bulk delete
  const handleBulkDelete = async () => {
    if (selectedShifts.length === 0) return;
    
    setIsDeleting(true);
    
    try {
      // Since we're using mock data, we'll skip the database operations
      // and just call the deleteShift function for each selected shift
      
      console.log("Selected shifts for deletion:", selectedShifts);
      
      if (deleteShift) {
        // Use the provided deleteShift function
        selectedShifts.forEach(id => {
          console.log("Deleting shift:", id);
          deleteShift(id);
        });
      } else if (window.deleteShift) {
        // Fallback to global deleteShift function
        selectedShifts.forEach(id => {
          console.log("Using global deleteShift for:", id);
          window.deleteShift?.(id);
        });
      }
      
      toast({
        title: "Success",
        description: `${selectedShifts.length} shift${selectedShifts.length > 1 ? 's' : ''} deleted successfully`
      });
      
      // Clear selection
      setSelectedShifts([]);
      
    } catch (error) {
      console.error("Error deleting shifts:", error);
      toast({
        title: "Error",
        description: "Failed to delete shifts",
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
        
        {isAdmin && (
          <Button onClick={() => navigate("/create-shift")}>
            <PlusCircle className="mr-2 h-4 w-4" />
            Create Shift
          </Button>
        )}
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
