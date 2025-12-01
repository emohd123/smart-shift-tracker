
import { Button } from "@/components/ui/button";
import { PlusCircle, RefreshCw, Trash2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

interface ShiftListHeaderProps {
  title: string;
  isAdmin: boolean;
  isRefreshing: boolean;
  handleRefresh: () => void;
  refreshShifts?: () => void;
  deleteAllShifts?: () => Promise<void>;
}

const ShiftListHeader = ({ 
  title, 
  isAdmin, 
  isRefreshing, 
  handleRefresh,
  refreshShifts,
  deleteAllShifts
}: ShiftListHeaderProps) => {
  const navigate = useNavigate();
  
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
  
  return (
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
        
        {isAdmin && deleteAllShifts && (
          <Button 
            variant="destructive" 
            onClick={handleDeleteAll}
            className="gap-2"
          >
            <Trash2 className="h-4 w-4" />
            Delete All
          </Button>
        )}
        
        {isAdmin && (
          <Button onClick={() => navigate("/shifts/create")}>
            <PlusCircle className="mr-2 h-4 w-4" />
            Create Shift
          </Button>
        )}
      </div>
    </div>
  );
};

export default ShiftListHeader;
