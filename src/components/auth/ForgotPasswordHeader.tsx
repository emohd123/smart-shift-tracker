
import { Clock } from "lucide-react";

export function ForgotPasswordHeader() {
  return (
    <div className="text-center">
      <div className="mx-auto w-12 h-12 rounded-xl bg-primary flex items-center justify-center mb-3">
        <Clock className="text-white" size={20} />
      </div>
      <h2 className="text-2xl font-bold tracking-tight">Reset your password</h2>
      <p className="text-sm text-muted-foreground mt-2">
        Enter your email and we'll send you instructions
      </p>
    </div>
  );
}
