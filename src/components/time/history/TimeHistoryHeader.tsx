
import React from "react";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { formatBHD } from "@/components/shifts/utils/currencyUtils";

interface TimeHistoryHeaderProps {
  totalEarnings: number;
}

const TimeHistoryHeader = ({ totalEarnings }: TimeHistoryHeaderProps) => {
  const navigate = useNavigate();
  
  return (
    <>
      <div className="flex items-center justify-between">
        <Button 
          variant="ghost" 
          size="sm" 
          className="mb-0" 
          onClick={() => navigate('/time-tracking')}
        >
          <ArrowLeft size={16} className="mr-1" />
          Back to Time Tracking
        </Button>
      </div>
      
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold">Time Tracking History</h2>
          <p className="text-muted-foreground text-sm">
            Your complete time tracking record
          </p>
        </div>
        <div className="bg-muted/40 px-4 py-2 rounded-md text-center">
          <div className="text-sm text-muted-foreground">Total Earnings</div>
          <div className="text-xl font-bold">{formatBHD(totalEarnings)}</div>
        </div>
      </div>
    </>
  );
};

export default TimeHistoryHeader;
