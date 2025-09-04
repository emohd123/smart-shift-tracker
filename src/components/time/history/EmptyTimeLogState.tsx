
import React from "react";
import { Clock, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

interface EmptyTimeLogStateProps {
  searchTerm: string;
}

const EmptyTimeLogState = ({ searchTerm }: EmptyTimeLogStateProps) => {
  const navigate = useNavigate();
  
  return (
    <div className="bg-muted/30 rounded-lg p-8 text-center">
      {searchTerm ? (
        <>
          <Search className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-medium mb-2">No Time Logs Found</h3>
          <p className="text-muted-foreground mb-6">
            No time logs match your search criteria "{searchTerm}".
          </p>
          <Button 
            variant="outline" 
            onClick={() => navigate("/time-tracking")}
            className="mx-auto"
          >
            Clear Search
          </Button>
        </>
      ) : (
        <>
          <Clock className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-medium mb-2">No Time Logs Yet</h3>
          <p className="text-muted-foreground mb-6">
            You don't have any completed time tracking sessions yet.
          </p>
          <Button 
            variant="default" 
            onClick={() => navigate("/time-tracking")}
            className="mx-auto"
          >
            Start Tracking Time
          </Button>
        </>
      )}
    </div>
  );
};

export default EmptyTimeLogState;
