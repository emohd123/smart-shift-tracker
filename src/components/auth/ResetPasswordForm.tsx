
import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Clock } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ResetPasswordHeader } from "./ResetPasswordHeader";
import { PasswordFields } from "./PasswordFields";

interface ResetPasswordFormProps {
  token: string | null;
}

export default function ResetPasswordForm({ token }: ResetPasswordFormProps) {
  const { updatePassword, loading, authError } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [formError, setFormError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    
    if (!token) {
      setFormError("Invalid or missing reset token. Please request a new password reset link.");
      return;
    }
    
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
      <ResetPasswordHeader />

      {formError && (
        <Alert variant="destructive" className="text-sm">
          <AlertDescription>{formError}</AlertDescription>
        </Alert>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        <PasswordFields 
          password={password}
          setPassword={setPassword}
          confirmPassword={confirmPassword}
          setConfirmPassword={setConfirmPassword}
        />

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
