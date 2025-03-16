
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import LoginForm from "@/components/auth/LoginForm";
import { toast } from "sonner";

const Login = () => {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  // Check if user is already authenticated and redirect
  useEffect(() => {
    if (isAuthenticated) {
      toast.info("Already signed in");
      navigate("/shifts");
    }
  }, [isAuthenticated, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="w-full max-w-md">
        <LoginForm />
      </div>
    </div>
  );
};

export default Login;
