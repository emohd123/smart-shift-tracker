
import { ShiftForm } from "@/components/shifts/ShiftForm";
import AppLayout from "@/components/layout/AppLayout";
import { useAuth } from "@/context/AuthContext";
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

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
  
  if (!isAuthenticated || (user && user.role !== "admin")) {
    return null;
  }
  
  return (
    <AppLayout title="Create Shift">
      <div className="max-w-3xl mx-auto">
        <ShiftForm />
      </div>
    </AppLayout>
  );
}
