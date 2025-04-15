
import { Button } from "@/components/ui/button";
import { PlusCircle, RefreshCw } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface ShiftListHeaderProps {
  title: string;
  isAdmin: boolean;
  isRefreshing: boolean;
  handleRefresh: () => void;
  refreshShifts?: () => void;
}

const ShiftListHeader = ({ 
  title, 
  isAdmin, 
  isRefreshing, 
  handleRefresh,
  refreshShifts 
}: ShiftListHeaderProps) => {
  const navigate = useNavigate();
  
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
        
        {isAdmin && (
          <Button onClick={() => navigate("/create-shift")}>
            <PlusCircle className="mr-2 h-4 w-4" />
            Create Shift
          </Button>
        )}
      </div>
    </div>
  );
};

export default ShiftListHeader;
