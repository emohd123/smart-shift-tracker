
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import AppLayout from "@/components/layout/AppLayout";
import { ShiftForm } from "@/components/shifts/form/ShiftForm";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { isCompanyLike } from "@/utils/roleUtils";

const CreateShift = () => {
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuth();
  const [hasContract, setHasContract] = useState<boolean | null>(null);

  useEffect(() => {
    // Debug auth state


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

  useEffect(() => {
    const loadContract = async () => {
      if (!user?.id) return;
      if (user.role !== "company") {
        setHasContract(null);
        return;
      }
      try {
        const { data, error } = await (supabase as any)
          .from("company_contract_templates")
          .select("id")
          .eq("company_id", user.id)
          .eq("is_active", true)
          .limit(1)
          .maybeSingle();
        if (error) throw error;
        setHasContract(!!data?.id);
      } catch {
        // If table doesn't exist yet (before migration), don't block shift creation
        setHasContract(null);
      }
    };

    loadContract();
  }, [user?.id, user?.role]);

  return (
    <AppLayout title="Create Shift">
      <div className="max-w-4xl mx-auto">
        {user?.role === "company" && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Online Contract</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="text-sm text-muted-foreground">
                Promoters will sign your company contract once before starting their first shift.
              </div>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => navigate("/company/contract")}>
                  Manage Contract Template
                </Button>
                {hasContract === false && (
                  <Button onClick={() => navigate("/company/contract")}>
                    Create Contract
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        )}
        <ShiftForm />
      </div>
    </AppLayout>
  );
};

export default CreateShift;
