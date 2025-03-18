
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import LoginForm from "@/components/auth/LoginForm";
import { toast } from "sonner";

const Login = () => {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [pageError, setPageError] = useState<string | null>(null);

  // No need for useEffect here - we'll handle redirect in the LoginForm component
  // This reduces potential error sources in the Login page

  // Show a simpler error message if there's a page-level error
  if (pageError) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background px-4">
        <div className="w-full max-w-md text-center space-y-4">
          <h2 className="text-2xl font-bold">Something went wrong</h2>
          <p className="text-muted-foreground">{pageError}</p>
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

  // If the user is already authenticated, redirect them
  if (isAuthenticated) {
    // Use a more reliable way to redirect
    setTimeout(() => {
      toast.info("Already signed in");
      navigate("/shifts");
    }, 0);
    
    // Show a loading state while redirecting
    return (
      <div className="min-h-screen flex items-center justify-center bg-background px-4">
        <div className="w-full max-w-md text-center">
          <p>Already signed in. Redirecting...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="w-full max-w-md">
        <LoginForm onError={(msg) => setPageError(msg)} />
      </div>
    </div>
  );
};

export default Login;
