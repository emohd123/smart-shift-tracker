import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Coins, Download, Star, Zap } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

type CreditPackage = {
  id: string;
  credits: number;
  price: string;
  savings?: string;
  popular?: boolean;
};

const creditPackages: CreditPackage[] = [
  {
    id: "small",
    credits: 100,
    price: "$9.99",
  },
  {
    id: "medium", 
    credits: 500,
    price: "$39.99",
    savings: "20% bonus",
    popular: true
  },
  {
    id: "large",
    credits: 1200,
    price: "$79.99", 
    savings: "50% bonus"
  }
];

export default function CreditPurchase() {
  const { isAuthenticated, subscription } = useAuth();
  const [loading, setLoading] = useState<string | null>(null);
  const [userCredits, setUserCredits] = useState<number>(0);

  useEffect(() => {
    if (isAuthenticated) {
      fetchUserCredits();
    }
  }, [isAuthenticated]);

  const fetchUserCredits = async () => {
    try {
      const { data, error } = await supabase
        .from("user_credits")
        .select("credits_balance")
        .single();
      
      if (data) {
        setUserCredits(data.credits_balance);
      }
    } catch (error) {
      console.error("Error fetching credits:", error);
    }
  };

  const handlePurchaseCredits = async (packageId: string) => {
    if (!isAuthenticated) {
      toast.error("Please log in to purchase credits");
      return;
    }

    setLoading(packageId);
    try {
      const { data, error } = await supabase.functions.invoke('buy-credits', {
        body: { credits: packageId }
      });

      if (error) throw error;

      // Open Stripe checkout in a new tab
      window.open(data.url, '_blank');
    } catch (error) {
      console.error('Credit purchase error:', error);
      toast.error("Failed to start credit purchase");
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h2 className="text-3xl font-bold">Buy Credits</h2>
        <p className="text-muted-foreground">
          Credits can be used for certificate downloads, premium features, and training modules
        </p>
        {isAuthenticated && (
          <div className="flex items-center justify-center gap-2 mt-4">
            <Coins className="h-5 w-5 text-primary" />
            <span className="font-semibold">Current Balance: {userCredits} credits</span>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {creditPackages.map((pkg) => (
          <Card key={pkg.id} className={`relative ${pkg.popular ? 'border-primary' : ''}`}>
            {pkg.popular && (
              <Badge className="absolute -top-2 left-1/2 transform -translate-x-1/2">
                Most Popular
              </Badge>
            )}
            
            <CardHeader className="text-center space-y-4">
              <div className="mx-auto p-3 bg-primary/10 rounded-full w-fit">
                <Coins className="h-6 w-6 text-primary" />
              </div>
              <div>
                <CardTitle className="text-xl">{pkg.credits} Credits</CardTitle>
                <div className="flex items-baseline justify-center gap-1 mt-2">
                  <span className="text-3xl font-bold">{pkg.price}</span>
                </div>
                {pkg.savings && (
                  <Badge variant="secondary" className="mt-2">
                    {pkg.savings}
                  </Badge>
                )}
              </div>
            </CardHeader>

            <CardContent className="space-y-4">
              <div className="space-y-2 text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <Download className="h-4 w-4 text-green-500" />
                  <span>{Math.floor(pkg.credits / 25)} certificate downloads</span>
                </div>
                <div className="flex items-center gap-2">
                  <Star className="h-4 w-4 text-green-500" />
                  <span>{Math.floor(pkg.credits / 50)} training modules</span>
                </div>
                <div className="flex items-center gap-2">
                  <Zap className="h-4 w-4 text-green-500" />
                  <span>Premium features access</span>
                </div>
              </div>

              <Button
                onClick={() => handlePurchaseCredits(pkg.id)}
                disabled={loading === pkg.id}
                variant={pkg.popular ? "default" : "outline"}
                className="w-full"
              >
                {loading === pkg.id ? (
                  <div className="flex items-center gap-2">
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                    Processing...
                  </div>
                ) : (
                  "Purchase Credits"
                )}
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      {subscription?.subscribed && (
        <div className="text-center bg-primary/5 p-4 rounded-lg">
          <p className="text-sm text-muted-foreground">
            <strong>Subscription Bonus:</strong> As a {subscription.subscription_tier} subscriber, you get unlimited certificate downloads!
          </p>
        </div>
      )}

      <div className="bg-muted/50 p-4 rounded-lg">
        <h3 className="font-semibold mb-2">Credit Usage Guide:</h3>
        <ul className="text-sm text-muted-foreground space-y-1">
          <li>• Certificate Download: 25 credits</li>
          <li>• Training Module Access: 50-100 credits (varies by module)</li>
          <li>• Premium Job Posting: 200 credits</li>
          <li>• Expedited Verification: 150 credits</li>
        </ul>
      </div>
    </div>
  );
}