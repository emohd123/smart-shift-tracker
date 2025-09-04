
import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import ResetPasswordForm from "@/components/auth/ResetPasswordForm";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";

const ResetPassword = () => {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [token, setToken] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Extract token from URL query parameters
  useEffect(() => {
    const queryParams = new URLSearchParams(location.search);
    const tokenParam = queryParams.get('token');
    
    if (!tokenParam) {
      setError("Password reset link is invalid or has expired. Please request a new link.");
    } else {
      setToken(tokenParam);
    }
  }, [location.search]);

  // Don't redirect authenticated users because they may be
  // completing the password reset process

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="w-full max-w-md">
        {error ? (
          <div className="space-y-6">
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
            <div className="text-center">
              <button 
                onClick={() => navigate("/forgot-password")}
                className="text-primary hover:underline"
              >
                Request a new password reset link
              </button>
            </div>
          </div>
        ) : (
          <ResetPasswordForm token={token} />
        )}
      </div>
    </div>
  );
};

export default ResetPassword;
