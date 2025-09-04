import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";

interface LoginFormAlertProps {
  formError: string | null;
  isCreatingAdmin: boolean;
}

export function LoginFormAlert({ formError, isCreatingAdmin }: LoginFormAlertProps) {
  if (!formError) return null;
  
  // Handle different error types more gracefully
  let displayMessage = formError;
  
  // More friendly messages for common errors
  if (formError.includes("Invalid login credentials")) {
    displayMessage = "The email or password you entered is incorrect. Please try again.";
  } else if (formError.includes("Email not confirmed")) {
    displayMessage = "Please confirm your email before signing in.";
  } else if (formError.includes("network") || formError.includes("connection")) {
    displayMessage = "Network error. Please check your internet connection and try again.";
  } else if (formError.includes("required")) {
    // Keep the original message for required field errors
    displayMessage = formError;
  }
  
  return (
    <Alert variant="destructive" className="text-sm">
      <AlertCircle className="h-4 w-4 mr-2" />
      <AlertDescription>{displayMessage}</AlertDescription>
    </Alert>
  );
}
