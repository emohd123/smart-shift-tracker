
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Mail, Home, LogIn, ArrowRight } from "lucide-react";
import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";

interface RegistrationSuccessProps {
  emailConfirmationRequired?: boolean;
}

export function RegistrationSuccess({ emailConfirmationRequired = true }: RegistrationSuccessProps) {
  const { isAuthenticated, user } = useAuth();
  const navigate = useNavigate();
  const [countdown, setCountdown] = useState(3);

  // If user is already authenticated (auto-login), redirect to dashboard
  useEffect(() => {
    if (isAuthenticated && user && !emailConfirmationRequired) {
      const timer = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            const dashboardPath = user.role === 'company' ? '/company' : '/dashboard';
            navigate(dashboardPath);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(timer);
    }
  }, [isAuthenticated, user, emailConfirmationRequired, navigate]);

  // If authenticated and auto-login worked
  if (isAuthenticated && user && !emailConfirmationRequired) {
    return (
      <div className="text-center space-y-6">
        <div className="bg-green-50 border border-green-200 rounded-lg p-6 text-center">
          <div className="mx-auto w-12 h-12 rounded-full bg-green-100 flex items-center justify-center mb-4">
            <ArrowRight className="h-6 w-6 text-green-600" />
          </div>
          <h3 className="text-lg font-medium text-green-900 mb-2">Welcome, {user.name}! 🎉</h3>
          <p className="text-sm text-green-700">
            Your account is ready. Redirecting to your dashboard in {countdown}...
          </p>
        </div>
        <Button onClick={() => navigate(user.role === 'company' ? '/company' : '/dashboard')}>
          Go to Dashboard Now
          <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </div>
    );
  }

  // Email confirmation required flow
  return (
    <div className="text-center space-y-6">
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 text-center">
        <div className="mx-auto w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center mb-4">
          <Mail className="h-6 w-6 text-blue-600" />
        </div>
        <h3 className="text-lg font-medium text-blue-900 mb-2">Check Your Email! 📧</h3>
        <p className="text-sm text-blue-700">
          We've sent a confirmation link to your email address. 
          Please click the link to verify your account and complete registration.
        </p>
      </div>
      
      <div className="bg-muted/50 rounded-lg p-4 text-sm text-muted-foreground">
        <p className="mb-2">Didn't receive the email?</p>
        <ul className="text-left list-disc list-inside space-y-1">
          <li>Check your spam or junk folder</li>
          <li>Make sure you entered the correct email</li>
          <li>Wait a few minutes and try again</li>
        </ul>
      </div>

      <div className="flex justify-center space-x-4">
        <Link to="/login">
          <Button variant="default">
            <LogIn className="mr-2 h-4 w-4" />
            Go to Login
          </Button>
        </Link>
        <Link to="/">
          <Button variant="outline">
            <Home className="mr-2 h-4 w-4" />
            Back to Home
          </Button>
        </Link>
      </div>
    </div>
  );
}
