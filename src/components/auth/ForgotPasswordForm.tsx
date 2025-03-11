
import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Clock, ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";
import { Alert, AlertDescription } from "@/components/ui/alert";

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
      <div className="text-center">
        <div className="mx-auto w-12 h-12 rounded-xl bg-primary flex items-center justify-center mb-3">
          <Clock className="text-white" size={20} />
        </div>
        <h2 className="text-2xl font-bold tracking-tight">Reset your password</h2>
        <p className="text-sm text-muted-foreground mt-2">
          Enter your email and we'll send you instructions
        </p>
      </div>

      {formError && (
        <Alert variant="destructive" className="text-sm">
          <AlertDescription>{formError}</AlertDescription>
        </Alert>
      )}

      {submitted ? (
        <div className="text-center space-y-6">
          <div className="bg-primary/10 rounded-lg p-4 text-center">
            <p className="text-sm text-center">
              We've sent password reset instructions to <strong>{email}</strong>.
              <br/>Please check your email inbox and spam folder.
            </p>
          </div>
          <Link 
            to="/login" 
            className="inline-flex items-center text-primary hover:text-primary/90"
          >
            <ArrowLeft size={16} className="mr-1" />
            Back to login
          </Link>
        </div>
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
