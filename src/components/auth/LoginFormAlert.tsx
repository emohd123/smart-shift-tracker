
import { Alert, AlertDescription } from "@/components/ui/alert";

interface LoginFormAlertProps {
  formError: string | null;
  isCreatingAdmin: boolean;
}

export function LoginFormAlert({ formError, isCreatingAdmin }: LoginFormAlertProps) {
  return (
    <>
      {formError && (
        <Alert variant="destructive" className="text-sm">
          <AlertDescription>{formError}</AlertDescription>
        </Alert>
      )}

      {isCreatingAdmin && (
        <Alert className="text-sm bg-yellow-50 border-yellow-200">
          <AlertDescription>Setting up admin account...</AlertDescription>
        </Alert>
      )}
    </>
  );
}
