import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import SubscriptionPlans from "@/components/subscription/SubscriptionPlans";
import CreditPurchase from "@/components/credits/CreditPurchase";
import TrainingModules from "@/components/training/TrainingModules";
import AppLayout from "@/components/layout/AppLayout";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export default function RevenuePage() {
  const [searchParams] = useSearchParams();
  const { checkSubscription } = useAuth();
  const [activeTab, setActiveTab] = useState("subscriptions");

  useEffect(() => {
    // Handle payment success for subscriptions
    const subscriptionStatus = searchParams.get('subscription');
    if (subscriptionStatus === 'success') {
      toast.success("Subscription activated successfully!");
      checkSubscription();
    } else if (subscriptionStatus === 'cancelled') {
      toast.info("Subscription cancelled");
    }

    // Handle payment success for credits
    const creditsStatus = searchParams.get('credits');
    const creditsAmount = searchParams.get('amount');
    if (creditsStatus === 'success' && creditsAmount) {
      toast.success(`Successfully purchased ${creditsAmount} credits!`);
      // Add credits to user account (would normally be handled by webhook)
      handleCreditsPurchaseSuccess(parseInt(creditsAmount));
    } else if (creditsStatus === 'cancelled') {
      toast.info("Credit purchase cancelled");
    }
  }, [searchParams, checkSubscription]);

  const handleCreditsPurchaseSuccess = async (amount: number) => {
    try {
      const { error } = await supabase.rpc('add_user_credits', {
        p_user_id: (await supabase.auth.getUser()).data.user?.id,
        p_amount: amount,
        p_description: `Credit purchase - ${amount} credits`,
        p_reference_id: `purchase_${Date.now()}`
      });

      if (error) {
        console.error('Error adding credits:', error);
      }
    } catch (error) {
      console.error('Error processing credit purchase:', error);
    }
  };

  return (
    <AppLayout title="Revenue Management">
      <div className="container mx-auto py-8 px-4">
        <div className="text-center space-y-4 mb-8">
          <h1 className="text-4xl font-bold">Revenue Management</h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Manage subscription plans, credit purchases, and training module revenues
          </p>
        </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3 mb-8">
          <TabsTrigger value="subscriptions">Subscription Plans</TabsTrigger>
          <TabsTrigger value="credits">Buy Credits</TabsTrigger>
          <TabsTrigger value="training">Training Modules</TabsTrigger>
        </TabsList>
        
        <TabsContent value="subscriptions">
          <Card>
            <CardContent className="p-8">
              <SubscriptionPlans />
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="credits">
          <Card>
            <CardContent className="p-8">
              <CreditPurchase />
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="training">
          <Card>
            <CardContent className="p-8">
              <TrainingModules />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      </div>
    </AppLayout>
  );
}