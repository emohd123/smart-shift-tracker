
import { Clock } from "lucide-react";

export function ResetPasswordHeader() {
  return (
    <div className="text-center">
      <div className="mx-auto w-12 h-12 rounded-xl bg-primary flex items-center justify-center mb-3">
        <Clock className="text-white" size={20} />
      </div>
      <h2 className="text-2xl font-bold tracking-tight">Set new password</h2>
      <p className="text-sm text-muted-foreground mt-2">
        Create a new password for your account
      </p>
    </div>
  );
}
