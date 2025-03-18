
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import LoginForm from "@/components/auth/LoginForm";
import { toast } from "sonner";
import { ErrorBoundary } from "@/context/ErrorContext";

const Login = () => {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [error, setError] = useState<Error | null>(null);

  // Check if user is already authenticated and redirect
  useEffect(() => {
    try {
      if (isAuthenticated) {
        toast.info("Already signed in");
        navigate("/shifts");
      }
    } catch (err) {
      console.error("Error in auth redirect:", err);
      setError(err instanceof Error ? err : new Error("Unknown error"));
    }
  }, [isAuthenticated, navigate]);

  // If there's an error, show a simplified error message
  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background px-4">
        <div className="w-full max-w-md text-center space-y-4">
          <h2 className="text-2xl font-bold">Something went wrong</h2>
          <p className="text-muted-foreground">We encountered an error loading the login page.</p>
          <button 
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-primary text-white rounded hover:bg-primary/90"
          >
            Refresh Page
          </button>
        </div>
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <div className="min-h-screen flex items-center justify-center bg-background px-4">
        <div className="w-full max-w-md">
          <LoginForm />
        </div>
      </div>
    </ErrorBoundary>
  );
};

export default Login;
