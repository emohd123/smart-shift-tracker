
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import ForgotPasswordForm from "@/components/auth/ForgotPasswordForm";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

const ForgotPassword = () => {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      navigate("/dashboard");
    }
  }, [isAuthenticated, navigate]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background px-4">
      <div className="w-full max-w-md">
        <div className="mb-6">
          <Button 
            variant="ghost" 
            size="sm" 
            className="mb-4" 
            onClick={() => navigate("/login")}
          >
            <ArrowLeft size={16} className="mr-1" />
            Back to Login
          </Button>
        </div>
        <ForgotPasswordForm />
      </div>
    </div>
  );
};

export default ForgotPassword;
