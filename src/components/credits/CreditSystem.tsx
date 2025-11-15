import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Coins, CreditCard, TrendingUp, Users, FileText, Star } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface UserCredits {
  credits_balance: number;
  total_credits_purchased: number;
}

interface CreditTransaction {
  id: string;
  amount: number;
  transaction_type: string;
  description: string;
  created_at: string;
}

const creditPackages = [
  { credits: 25, price: 2.5, bonus: 0, popular: false },
  { credits: 50, price: 5, bonus: 0, popular: true },
  { credits: 100, price: 10, bonus: 10, popular: false },
  { credits: 250, price: 25, bonus: 35, popular: false },
];

const creditUses = [
  { icon: FileText, title: "Certificate Downloads", cost: "10 credits", description: "Download professional certificates" },
  { icon: Users, title: "Training Modules", cost: "40-100 credits", description: "Access skill development courses" },
  { icon: TrendingUp, title: "Analytics Dashboard", cost: "15 credits", description: "Advanced performance insights" },
];

export default function CreditSystem() {
  const { isAuthenticated } = useAuth();
  const [userCredits, setUserCredits] = useState<UserCredits | null>(null);
  const [recentTransactions, setRecentTransactions] = useState<CreditTransaction[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingPackage, setLoadingPackage] = useState<number | null>(null);

  useEffect(() => {
    if (isAuthenticated) {
      loadUserCredits();
      loadRecentTransactions();
    }
  }, [isAuthenticated]);

  const loadUserCredits = async () => {
    try {
      const { data, error } = await supabase
        .from('user_credits')
        .select('credits_balance, total_credits_purchased')
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      setUserCredits(data || { credits_balance: 0, total_credits_purchased: 0 });
    } catch (error) {
      console.error('Error loading credits:', error);
    }
  };

  const loadRecentTransactions = async () => {
    try {
      const { data, error } = await supabase
        .from('credit_transactions')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(5);

      if (error) throw error;
      setRecentTransactions(data || []);
    } catch (error) {
      console.error('Error loading transactions:', error);
    }
  };

  const handleBuyCredits = async (credits: number) => {
    if (!isAuthenticated) {
      toast.error("Please log in to purchase credits");
      return;
    }

    setLoadingPackage(credits);
    try {
      const { data, error } = await supabase.functions.invoke('buy-credits', {
        body: { credits }
      });

      if (error) throw error;

      // Open Stripe checkout
      window.open(data.url, '_blank');
    } catch (error) {
      console.error('Purchase error:', error);
      toast.error("Failed to start purchase process");
    } finally {
      setLoadingPackage(null);
    }
  };

  if (!isAuthenticated) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <div className="space-y-4">
            <Coins className="h-12 w-12 text-muted-foreground mx-auto" />
            <h3 className="text-lg font-semibold">Credits System</h3>
            <p className="text-muted-foreground">
              Please log in to view your credits and purchase additional credits for premium features.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Current Balance */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Coins className="h-5 w-5" />
            Your Credits
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="text-center p-4 bg-primary/5 rounded-lg">
              <p className="text-2xl font-bold text-primary">{userCredits?.credits_balance || 0}</p>
              <p className="text-sm text-muted-foreground">Available Credits</p>
            </div>
            <div className="text-center p-4 bg-secondary/5 rounded-lg">
              <p className="text-2xl font-bold text-secondary">{userCredits?.total_credits_purchased || 0}</p>
              <p className="text-sm text-muted-foreground">Total Purchased</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* How to Use Credits */}
      <Card>
        <CardHeader>
          <CardTitle>How to Use Credits</CardTitle>
          <CardDescription>Credits can be used for various premium features</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {creditUses.map((use, index) => {
              const Icon = use.icon;
              return (
                <div key={index} className="flex items-center space-x-3 p-3 border rounded-lg">
                  <Icon className="h-8 w-8 text-primary" />
                  <div className="flex-1">
                    <h4 className="font-medium">{use.title}</h4>
                    <p className="text-sm text-muted-foreground">{use.description}</p>
                    <Badge variant="secondary" className="mt-1">{use.cost}</Badge>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Purchase Credits */}
      <Card>
        <CardHeader>
          <CardTitle>Purchase Credits</CardTitle>
          <CardDescription>Choose a credit package that suits your needs</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {creditPackages.map((pkg, index) => (
              <div key={index} className={`border rounded-lg p-4 text-center space-y-3 ${pkg.popular ? 'border-primary bg-primary/5' : ''}`}>
                {pkg.popular && (
                  <Badge className="mb-2">Most Popular</Badge>
                )}
                <div>
                  <p className="text-2xl font-bold">{pkg.credits}</p>
                  <p className="text-sm text-muted-foreground">Credits</p>
                  {pkg.bonus > 0 && (
                    <p className="text-xs text-green-600">+{pkg.bonus} bonus!</p>
                  )}
                </div>
                <div className="space-y-1">
                  <p className="text-lg font-semibold">${pkg.price}</p>
                  <p className="text-xs text-muted-foreground">${(pkg.price / pkg.credits).toFixed(2)} per credit</p>
                </div>
                <Button
                  onClick={() => handleBuyCredits(pkg.credits + pkg.bonus)}
                  disabled={loadingPackage === pkg.credits}
                  variant={pkg.popular ? "default" : "outline"}
                  className="w-full"
                >
                  {loadingPackage === pkg.credits ? (
                    <div className="flex items-center gap-2">
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                      Processing...
                    </div>
                  ) : (
                    <>
                      <CreditCard className="h-4 w-4 mr-2" />
                      Purchase
                    </>
                  )}
                </Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Recent Transactions */}
      {recentTransactions.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Recent Transactions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {recentTransactions.map((transaction) => (
                <div key={transaction.id} className="flex justify-between items-center p-3 border rounded-lg">
                  <div>
                    <p className="font-medium">{transaction.description}</p>
                    <p className="text-sm text-muted-foreground">
                      {new Date(transaction.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <div className={`font-semibold ${transaction.amount > 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {transaction.amount > 0 ? '+' : ''}{transaction.amount}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}