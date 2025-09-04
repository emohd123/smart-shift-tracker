
import { Link } from "react-router-dom";

export function RegistrationSuccess() {
  return (
    <div className="text-center space-y-6">
      <div className="bg-primary/10 rounded-lg p-6 text-center">
        <h3 className="text-lg font-medium mb-2">Registration Successful!</h3>
        <p className="text-sm">
          Your account is now pending verification. You will be notified once your account is verified.
        </p>
      </div>
      <div className="flex justify-center space-x-4">
        <Link to="/login" className="text-primary hover:underline">
          Go to login
        </Link>
        <Link to="/" className="text-primary hover:underline">
          Back to Home
        </Link>
      </div>
    </div>
  );
}
