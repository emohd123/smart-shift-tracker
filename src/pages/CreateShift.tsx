
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


    if (!isAuthenticated) {

      navigate("/login");
      return;
    }

    if (!(user?.role === "admin" || user?.role === "company")) {

      toast.error("Permission Denied", {
        description: "Only admin or company users can create shifts"
      });
      navigate("/shifts");
    }
  }, [isAuthenticated, navigate, user]);

  if (!isAuthenticated || !(user?.role === "admin" || user?.role === "company")) {
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
