
import { AlertCircle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

interface ProfileLoadingErrorProps {
  message?: string;
}

export default function ProfileLoadingError({ message = "Failed to load profile data" }: ProfileLoadingErrorProps) {
  const navigate = useNavigate();
  
  return (
    <div className="space-y-6">
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>{message}</AlertDescription>
      </Alert>
      
      <div className="flex flex-col sm:flex-row gap-3">
        <Button 
          variant="outline" 
          onClick={() => navigate("/")}
        >
          Return Home
        </Button>
        
        <Button 
          onClick={() => window.location.reload()}
        >
          Try Again
        </Button>
      </div>
    </div>
  );
}
