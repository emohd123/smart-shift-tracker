
import { ShiftForm } from "@/components/shifts/form/ShiftForm";
import AppLayout from "@/components/layout/AppLayout";
import { useAuth } from "@/context/AuthContext";
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { ShieldAlert } from "lucide-react";

export default function CreateShift() {
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  
  // Only allow admins to access this page
  useEffect(() => {
    if (!isAuthenticated) {
      navigate("/login");
      return;
    }
    
    if (user && user.role !== "admin") {
      navigate("/shifts");
    }
  }, [isAuthenticated, user, navigate]);
  
  if (!isAuthenticated) {
    return null;
  }
  
  if (user && user.role !== "admin") {
    return (
      <AppLayout title="Unauthorized">
        <Alert variant="destructive" className="max-w-md mx-auto">
          <ShieldAlert className="h-4 w-4" />
          <AlertTitle>Access Denied</AlertTitle>
          <AlertDescription>
            You don't have permission to create shifts. This feature is only available to administrators.
          </AlertDescription>
        </Alert>
      </AppLayout>
    );
  }
  
  return (
    <AppLayout title="Create Shift">
      <div className="max-w-3xl mx-auto">
        <ShiftForm />
      </div>
    </AppLayout>
  );
}
