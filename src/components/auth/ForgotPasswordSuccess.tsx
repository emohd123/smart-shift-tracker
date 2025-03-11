
import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

interface ForgotPasswordSuccessProps {
  email: string;
}

export function ForgotPasswordSuccess({ email }: ForgotPasswordSuccessProps) {
  return (
    <div className="text-center space-y-6">
      <div className="bg-primary/10 rounded-lg p-4 text-center">
        <p className="text-sm text-center">
          We've sent password reset instructions to <strong>{email}</strong>.
          <br/>Please check your email inbox and spam folder.
        </p>
      </div>
      <Link 
        to="/login" 
        className="inline-flex items-center text-primary hover:text-primary/90"
      >
        <ArrowLeft size={16} className="mr-1" />
        Back to login
      </Link>
    </div>
  );
}
