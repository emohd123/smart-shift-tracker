
import { Link } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Copy, CheckCircle, User, Building2 } from "lucide-react";
import { useState, useEffect } from "react";
import { toast } from "sonner";

export function RegistrationSuccess() {
  const { user } = useAuth();
  const [uniqueCode, setUniqueCode] = useState<string>("");
  const [copied, setCopied] = useState(false);

  // Get unique code from user metadata or generate fallback
  useEffect(() => {
    if (user) {
      const code = (user.metadata?.unique_code as string) || 
                   'USR' + (user.id?.slice(-5).toUpperCase() || '00001');
      setUniqueCode(code);
    }
  }, [user]);

  const handleCopyCode = async () => {
    try {
      await navigator.clipboard.writeText(uniqueCode);
      setCopied(true);
      toast.success("Unique code copied to clipboard!");
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      toast.error("Failed to copy code");
    }
  };

  // Determine if user is a part-timer/promoter
  const isPromoter = user?.role === 'part_timer' || 
                    user?.metadata?.role === 'part_timer' ||
                    !user?.role; // Default new users to part-timer

  const isCompany = user?.role === 'company' || 
                   user?.role === 'company_admin' || 
                   user?.role === 'company_manager' ||
                   user?.metadata?.role === 'company';

  if (isPromoter) {
    return (
      <div className="text-center space-y-6 max-w-md mx-auto">
        <div className="bg-green-50 border border-green-200 rounded-lg p-6">
          <div className="flex items-center justify-center mb-4">
            <CheckCircle className="h-12 w-12 text-green-500" />
          </div>
          <h3 className="text-xl font-bold text-green-800 mb-2">
            Welcome to SmartShift, Promoter!
          </h3>
          <p className="text-sm text-green-700 mb-4">
            Your part-timer account has been created successfully.
          </p>
        </div>

        <Card className="border-2 border-primary/20">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <User className="h-5 w-5" />
              Your Unique Promoter Code
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-center gap-2">
                <Badge variant="secondary" className="text-lg font-mono px-4 py-2">
                  {uniqueCode}
                </Badge>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleCopyCode}
                  className="flex items-center gap-1"
                >
                  {copied ? <CheckCircle className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  {copied ? 'Copied!' : 'Copy'}
                </Button>
              </div>
              <div className="text-sm text-muted-foreground space-y-2">
                <p className="font-medium text-foreground">How companies will find you:</p>
                <p>• Share this code when applying for shifts</p>
                <p>• Companies search by your unique code</p>
                <p>• This makes assignment quick and easy</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-3">
          <p className="text-sm text-muted-foreground">
            Ready to start working? Visit your dashboard to see available shifts!
          </p>
          <Button asChild className="w-full">
            <Link to="/dashboard">
              Go to Your Dashboard
            </Link>
          </Button>
        </div>
      </div>
    );
  }

  if (isCompany) {
    return (
      <div className="text-center space-y-6 max-w-md mx-auto">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
          <div className="flex items-center justify-center mb-4">
            <Building2 className="h-12 w-12 text-blue-500" />
          </div>
          <h3 className="text-xl font-bold text-blue-800 mb-2">
            Welcome to SmartShift!
          </h3>
          <p className="text-sm text-blue-700 mb-4">
            Your company account has been created successfully.
          </p>
        </div>

        <div className="bg-primary/5 rounded-lg p-4">
          <p className="text-sm text-muted-foreground mb-4">
            You can now create shifts and assign part-timers using their unique codes.
          </p>
        </div>

        <div className="space-y-3">
          <Button asChild className="w-full">
            <Link to="/dashboard">
              Go to Company Dashboard
            </Link>
          </Button>
        </div>
      </div>
    );
  }

  // Default/fallback success message
  return (
    <div className="text-center space-y-6">
      <div className="bg-primary/10 rounded-lg p-6 text-center">
        <h3 className="text-lg font-medium mb-2">Registration Successful!</h3>
        <p className="text-sm">
          Your account has been created successfully. Redirecting to your dashboard...
        </p>
      </div>
      <div className="space-y-3">
        <Button asChild className="w-full">
          <Link to="/dashboard">
            Go to Dashboard
          </Link>
        </Button>
        <div className="flex justify-center space-x-4 text-sm">
          <Link to="/login" className="text-primary hover:underline">
            Login Later
          </Link>
          <Link to="/" className="text-primary hover:underline">
            Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
}
