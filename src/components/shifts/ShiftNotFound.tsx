
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { FileQuestion } from "lucide-react";

export const ShiftNotFound = () => {
  const navigate = useNavigate();
  
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <div className="bg-muted/30 p-4 rounded-full mb-4">
        <FileQuestion className="h-12 w-12 text-muted-foreground" />
      </div>
      <h2 className="text-2xl font-semibold mb-2">Shift Not Found</h2>
      <p className="text-muted-foreground mb-6 max-w-md">
        The shift you're looking for doesn't exist or has been removed.
      </p>
      <div className="flex gap-4">
        <Button onClick={() => navigate("/shifts")}>
          View All Shifts
        </Button>
        <Button variant="outline" onClick={() => navigate(-1)}>
          Go Back
        </Button>
      </div>
    </div>
  );
};
