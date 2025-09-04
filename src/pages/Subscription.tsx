import { useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import SubscriptionPlans from "@/components/subscription/SubscriptionPlans";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";

export default function Subscription() {
  const [searchParams] = useSearchParams();
  const { checkSubscription } = useAuth();

  useEffect(() => {
    const status = searchParams.get('subscription');
    if (status === 'success') {
      toast.success("Subscription activated successfully!");
      checkSubscription();
    } else if (status === 'cancelled') {
      toast.info("Subscription cancelled");
    }
  }, [searchParams, checkSubscription]);

  return (
    <div className="container mx-auto py-8 px-4">
      <Card>
        <CardContent className="p-8">
          <SubscriptionPlans />
        </CardContent>
      </Card>
    </div>
  );
}