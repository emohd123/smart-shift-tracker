
import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Clock } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function ResetPasswordForm() {
  const { updatePassword, loading, authError } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [formError, setFormError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    
    if (password !== confirmPassword) {
      setFormError("Passwords do not match");
      return;
    }
    
    try {
      await updatePassword(password);
      toast({
        title: "Password reset successful",
        description: "Your password has been updated successfully",
      });
      navigate("/login");
    } catch (error) {
      console.error("Password update error:", error);
      setFormError((error as Error).message || "Failed to update password");
      toast({
        title: "Password reset failed",
        description: (error as Error).message || "Failed to update password",
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
        <h2 className="text-2xl font-bold tracking-tight">Set new password</h2>
        <p className="text-sm text-muted-foreground mt-2">
          Create a new password for your account
        </p>
      </div>

      {formError && (
        <Alert variant="destructive" className="text-sm">
          <AlertDescription>{formError}</AlertDescription>
        </Alert>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="space-y-2">
          <Label htmlFor="password">New Password</Label>
          <Input
            id="password"
            type="password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="h-11"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="confirmPassword">Confirm New Password</Label>
          <Input
            id="confirmPassword"
            type="password"
            placeholder="••••••••"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
            className="h-11"
          />
        </div>

        <Button 
          type="submit" 
          className="w-full h-11 font-medium"
          disabled={loading}
        >
          {loading ? "Updating..." : "Reset Password"}
        </Button>
      </form>
    </div>
  );
}
