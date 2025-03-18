
import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Link, useNavigate } from "react-router-dom";
import { LoginFormAlert } from "./LoginFormAlert";
import { LoginCredentials } from "./LoginCredentials";
import { LoginActions } from "./LoginActions";
import { toast } from "sonner";
import { Clock } from "lucide-react";
import { useError, ErrorSeverity } from "@/context/ErrorContext";

interface LoginFormProps {
  onError?: (message: string) => void;
}

export default function LoginForm({ onError }: LoginFormProps) {
  const { login, loading, authError, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const { addError } = useError();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(
    localStorage.getItem('rememberMe') === 'true'
  );
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      navigate("/shifts");
    }
  }, [isAuthenticated, navigate]);

  // Clear form error when inputs change
  useEffect(() => {
    if (formError) {
      setFormError(null);
    }
  }, [email, password]);

  // Update parent component if there's an error
  useEffect(() => {
    if (formError && onError) {
      onError(formError);
    }
  }, [formError, onError]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Reset form error
    setFormError(null);
    
    // Validate fields - email and password are required
    if (!email.trim()) {
      setFormError("Email or username is required");
      return;
    }
    
    if (!password) {
      setFormError("Password is required");
      return;
    }
    
    try {
      console.log("Attempting login with:", email, "Remember me:", rememberMe);
      
      // Set local submitting state to true
      setIsSubmitting(true);
      
      // Normalize email input (trim whitespace)
      const normalizedEmail = email.trim();
      
      await login(normalizedEmail, password, rememberMe);
      
      toast.success("Logged in successfully", {
        description: "Welcome to SmartShift",
      });
      
      // Navigation happens in the useEffect that watches isAuthenticated
    } catch (error) {
      console.error("Login error caught in form:", error);
      const errorMessage = error instanceof Error ? error.message : "Invalid email or password";
      
      setFormError(errorMessage);
      setIsSubmitting(false); // Reset submitting state on error
      
      // Log to error context for tracking
      addError(errorMessage, ErrorSeverity.ERROR, error);
      
      toast.error("Login failed", {
        description: errorMessage,
      });
    }
  };

  return (
    <div className="w-full max-w-md space-y-6 animate-fade-in">
      <div className="text-center">
        <div className="mx-auto w-12 h-12 rounded-xl bg-primary flex items-center justify-center mb-3">
          <Clock className="text-white" size={20} />
        </div>
        <h2 className="text-2xl font-bold tracking-tight">Welcome to SmartShift</h2>
        <p className="text-sm text-muted-foreground mt-2">
          Sign in to manage your shifts and track time
        </p>
      </div>

      <LoginFormAlert 
        formError={formError || authError} 
        isCreatingAdmin={false} 
      />

      <form onSubmit={handleSubmit} className="space-y-5">
        <LoginCredentials 
          email={email}
          setEmail={setEmail}
          password={password}
          setPassword={setPassword}
          rememberMe={rememberMe}
          setRememberMe={setRememberMe}
        />

        <LoginActions 
          loading={isSubmitting} 
          isCreatingAdmin={false} 
        />
      </form>
    </div>
  );
}
