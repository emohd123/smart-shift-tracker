import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Check, Crown, Zap, Star } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const plans = [
  {
    id: "basic",
    name: "Basic",
    price: "$9.99",
    period: "/month",
    icon: Check,
    features: [
      "Up to 5 certificate downloads",
      "Basic certificate templates",
      "Email support",
      "Standard verification"
    ]
  },
  {
    id: "premium",
    name: "Premium",
    price: "$19.99",
    period: "/month",
    icon: Crown,
    popular: true,
    features: [
      "Unlimited certificate downloads",
      "Premium certificate templates",
      "Priority email support",
      "Advanced verification",
      "Custom branding",
      "Export to multiple formats"
    ]
  },
  {
    id: "enterprise",
    name: "Enterprise",
    price: "$49.99",
    period: "/month",
    icon: Star,
    features: [
      "Everything in Premium",
      "White-label certificates",
      "API access",
      "Dedicated account manager",
      "Custom integrations",
      "SLA guarantee"
    ]
  }
];

export default function SubscriptionPlans() {
  const { subscription, isAuthenticated } = useAuth();
  const [loading, setLoading] = useState<string | null>(null);

  const handleSubscribe = async (planId: string) => {
    if (!isAuthenticated) {
      toast.error("Please log in to subscribe");
      return;
    }

    setLoading(planId);
    try {
      const { data, error } = await supabase.functions.invoke('create-checkout', {
        body: { plan: planId }
      });

      if (error) throw error;

      // Open Stripe checkout in a new tab
      window.open(data.url, '_blank');
    } catch (error) {
      console.error('Subscription error:', error);
      toast.error("Failed to start subscription process");
    } finally {
      setLoading(null);
    }
  };

  const handleManageSubscription = async () => {
    if (!isAuthenticated) {
      toast.error("Please log in to manage subscription");
      return;
    }

    try {
      const { data, error } = await supabase.functions.invoke('customer-portal');
      if (error) throw error;

      // Open customer portal in a new tab
      window.open(data.url, '_blank');
    } catch (error) {
      console.error('Portal error:', error);
      toast.error("Failed to open customer portal");
    }
  };

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h2 className="text-3xl font-bold">Choose Your Plan</h2>
        <p className="text-muted-foreground">
          Unlock premium features and unlimited certificate generation
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {plans.map((plan) => {
          const Icon = plan.icon;
          const isCurrentPlan = subscription?.subscription_tier === plan.id;
          const isSubscribed = subscription?.subscribed;

          return (
            <Card key={plan.id} className={`relative ${plan.popular ? 'border-primary' : ''}`}>
              {plan.popular && (
                <Badge className="absolute -top-2 left-1/2 transform -translate-x-1/2">
                  Most Popular
                </Badge>
              )}
              
              <CardHeader className="text-center space-y-4">
                <div className="mx-auto p-3 bg-primary/10 rounded-full w-fit">
                  <Icon className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <CardTitle className="text-xl">{plan.name}</CardTitle>
                  <div className="flex items-baseline justify-center gap-1 mt-2">
                    <span className="text-3xl font-bold">{plan.price}</span>
                    <span className="text-muted-foreground">{plan.period}</span>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="space-y-4">
                <ul className="space-y-2">
                  {plan.features.map((feature, index) => (
                    <li key={index} className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-green-500 flex-shrink-0" />
                      <span className="text-sm">{feature}</span>
                    </li>
                  ))}
                </ul>

                {isCurrentPlan ? (
                  <Button 
                    onClick={handleManageSubscription}
                    variant="outline" 
                    className="w-full"
                  >
                    Manage Subscription
                  </Button>
                ) : (
                  <Button
                    onClick={() => handleSubscribe(plan.id)}
                    disabled={loading === plan.id}
                    variant={plan.popular ? "default" : "outline"}
                    className="w-full"
                  >
                    {loading === plan.id ? (
                      <div className="flex items-center gap-2">
                        <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                        Processing...
                      </div>
                    ) : isSubscribed ? (
                      "Switch Plan"
                    ) : (
                      "Get Started"
                    )}
                  </Button>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {subscription?.subscribed && (
        <div className="text-center space-y-2">
          <p className="text-sm text-muted-foreground">
            Current plan: <strong className="capitalize">{subscription.subscription_tier}</strong>
          </p>
          {subscription.subscription_end && (
            <p className="text-sm text-muted-foreground">
              Renews on {new Date(subscription.subscription_end).toLocaleDateString()}
            </p>
          )}
        </div>
      )}
    </div>
  );
}