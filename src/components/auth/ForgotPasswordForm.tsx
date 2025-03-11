
import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Clock, ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ForgotPasswordHeader } from "./ForgotPasswordHeader";
import { ForgotPasswordSuccess } from "./ForgotPasswordSuccess";

export default function ForgotPasswordForm() {
  const { resetPassword, loading, authError } = useAuth();
  const { toast } = useToast();
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    
    try {
      await resetPassword(email);
      setSubmitted(true);
      toast({
        title: "Password reset email sent",
        description: "Check your inbox for instructions to reset your password",
      });
    } catch (error) {
      console.error("Password reset error:", error);
      setFormError((error as Error).message || "Failed to send reset email");
      toast({
        title: "Password reset failed",
        description: (error as Error).message || "Failed to send reset email",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="w-full max-w-md space-y-6 animate-fade-in">
      <ForgotPasswordHeader />

      {formError && (
        <Alert variant="destructive" className="text-sm">
          <AlertDescription>{formError}</AlertDescription>
        </Alert>
      )}

      {submitted ? (
        <ForgotPasswordSuccess email={email} />
      ) : (
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="yourname@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
              className="h-11"
            />
          </div>

          <Button 
            type="submit" 
            className="w-full h-11 font-medium"
            disabled={loading}
          >
            {loading ? "Sending..." : "Send reset link"}
          </Button>

          <Link 
            to="/login" 
            className="block text-center text-sm text-primary hover:text-primary/90"
          >
            <span className="inline-flex items-center">
              <ArrowLeft size={16} className="mr-1" />
              Back to login
            </span>
          </Link>
        </form>
      )}
    </div>
  );
}
