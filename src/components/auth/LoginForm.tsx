
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
import { useSecurity } from "@/components/security/SecurityProvider";
import { sanitizeInput, emailSchema, useInputValidation, containsSqlInjection } from "@/utils/validation";
import { useRateLimit } from "@/hooks/security/useRateLimit";

interface LoginFormProps {
  onError?: (message: string) => void;
}

export default function LoginForm({ onError }: LoginFormProps) {
  const { login, loading, authError, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const { addError } = useError();
  const { csrfToken, rateLimit } = useSecurity();
  const { validateInput } = useInputValidation();
  
  // Rate limiting for login attempts
  const loginRateLimit = useRateLimit({
    maxAttempts: 5,
    windowMs: 15 * 60 * 1000, // 15 minutes
    message: 'Too many login attempts. Please wait 15 minutes before trying again.'
  });
  
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(
    localStorage.getItem('rememberMe') === 'true'
  );
  const [formError, setFormError] = useState<string | null>(null);

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


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Reset form error
    setFormError(null);
    
    // Check rate limiting first
    if (loginRateLimit.isBlocked) {
      setFormError(loginRateLimit.message);
      return;
    }
    
    // Validate fields - email and password are required
    if (!email.trim()) {
      setFormError("Email or username is required");
      return;
    }
    
    if (!password) {
      setFormError("Password is required");
      return;
    }
    
    // Security validation
    const sanitizedEmail = sanitizeInput(email.trim());
    const sanitizedPassword = password; // Don't sanitize password as it may contain special chars
    
    // Remove trailing @ symbols
    const cleanedEmail = sanitizedEmail.replace(/@+$/, '');
    
    // Check for SQL injection attempts
    if (containsSqlInjection(cleanedEmail)) {
      setFormError("Invalid characters detected in email");
      loginRateLimit.recordAttempt(); // Count as failed attempt
      return;
    }
    
    // Validate email format if it looks like an email
    // Improved regex to catch more invalid formats
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    
    if (cleanedEmail.includes('@')) {
      // If it contains @, it must be a valid email format
      if (!emailRegex.test(cleanedEmail)) {
        setFormError("Invalid email format. Please enter a complete email address.");
        return;
      }
      
      const emailValidation = validateInput(cleanedEmail, emailSchema);
      if (!emailValidation.isValid) {
        setFormError(emailValidation.error || "Invalid email format");
        return;
      }
    }
    
    // Basic password length check
    if (sanitizedPassword.length < 6) {
      setFormError("Password is too short");
      return;
    }
    
    try {
      console.log("Attempting secure login with CSRF token");
      
      // Record login attempt for rate limiting
      if (!loginRateLimit.recordAttempt()) {
        setFormError(loginRateLimit.message);
        return;
      }
      
      // Add 30-second timeout to prevent indefinite hanging
      const loginPromise = login(cleanedEmail, sanitizedPassword, rememberMe);
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error("Login timeout. Please try again.")), 30000)
      );
      
      await Promise.race([loginPromise, timeoutPromise]);
      
      // Reset rate limit on successful login
      loginRateLimit.reset();
      
      toast.success("Logged in successfully", {
        description: "Welcome to SmartShift",
      });
      
      // Navigation happens in the useEffect that watches isAuthenticated
    } catch (error) {
      console.error("Login error caught in form:", error);
      const errorMessage = error instanceof Error ? error.message : "Invalid email or password";
      
      setFormError(errorMessage);
      
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
          loading={loading} 
          isCreatingAdmin={false} 
        />
      </form>
    </div>
  );
}
