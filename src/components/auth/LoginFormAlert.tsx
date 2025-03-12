
import { Alert, AlertDescription } from "@/components/ui/alert";

interface LoginFormAlertProps {
  formError: string | null;
  isCreatingAdmin: boolean;
}

export function LoginFormAlert({ formError }: LoginFormAlertProps) {
  return (
    <>
      {formError && (
        <Alert variant="destructive" className="text-sm">
          <AlertDescription>{formError}</AlertDescription>
        </Alert>
      )}
    </>
  );
}
