
import React from "react";
import { Clock } from "lucide-react";

interface EmptyTimeLogStateProps {
  searchTerm: string;
}

const EmptyTimeLogState = ({ searchTerm }: EmptyTimeLogStateProps) => {
  return (
    <div className="bg-muted/30 rounded-lg p-6 text-center">
      <Clock className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
      <h3 className="text-lg font-medium mb-2">No Time Logs Found</h3>
      <p className="text-muted-foreground">
        {searchTerm 
          ? "No time logs match your search criteria."
          : "You don't have any completed time tracking sessions yet."}
      </p>
    </div>
  );
};

export default EmptyTimeLogState;
