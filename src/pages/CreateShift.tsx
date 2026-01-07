
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import AppLayout from "@/components/layout/AppLayout";
import UnifiedShiftContractForm from "@/components/shifts/form/UnifiedShiftContractForm";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";
import { isCompanyLike } from "@/utils/roleUtils";

const CreateShift = () => {
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuth();

  useEffect(() => {
    if (!isAuthenticated) {
      navigate("/login");
      return;
    }

    if (!isCompanyLike(user?.role)) {
      toast.error("Permission Denied", {
        description: "Only admin or company users can create shifts"
      });
      navigate("/shifts");
    }
  }, [isAuthenticated, navigate, user?.role]);

  if (!isAuthenticated || !isCompanyLike(user?.role)) {
    return null;
  }

  return (
    <AppLayout title="Create Shift">
      <div className="max-w-4xl mx-auto">
        <UnifiedShiftContractForm />
      </div>
    </AppLayout>
  );
};

export default CreateShift;
