
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";

interface LoginFormAlertProps {
  formError: string | null;
  isCreatingAdmin: boolean;
}

export function LoginFormAlert({ formError, isCreatingAdmin }: LoginFormAlertProps) {
  if (!formError) return null;
  
  return (
    <Alert variant="destructive" className="text-sm">
      <AlertCircle className="h-4 w-4 mr-2" />
      <AlertDescription>{formError}</AlertDescription>
    </Alert>
  );
}
