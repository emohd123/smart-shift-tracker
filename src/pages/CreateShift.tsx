
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import AppLayout from "@/components/layout/AppLayout";
import { ShiftForm } from "@/components/shifts/form/ShiftForm";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";

const CreateShift = () => {
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuth();
  
  useEffect(() => {
    // Debug auth state
    console.log("CreateShift - Auth state:", { isAuthenticated, user, userRole: user?.role });
    
    if (!isAuthenticated) {
      console.log("CreateShift - Not authenticated, redirecting to login");
      navigate("/login");
      return;
    }
    
    if (user?.role !== "admin") {
      console.log("CreateShift - User is not admin, role:", user?.role);
      toast.error("Permission Denied", {
        description: "Only admin users can create shifts"
      });
      navigate("/shifts");
    }
  }, [isAuthenticated, navigate, user]);

  if (!isAuthenticated || user?.role !== "admin") {
    return null;
  }

  return (
    <AppLayout title="Create Shift">
      <div className="max-w-4xl mx-auto">
        <ShiftForm />
      </div>
    </AppLayout>
  );
};

export default CreateShift;
