
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { getRedirectAfterLogin } from "@/utils/routes";

const Signup = () => {
  const { isAuthenticated, user } = useAuth();
  const navigate = useNavigate();

  // Redirect if already authenticated or redirect to home with signup modal
  useEffect(() => {
    if (isAuthenticated && user) {
      const redirectPath = getRedirectAfterLogin(user.role);
      navigate(redirectPath);
    } else {
      // Redirect to home page - the signup modal will be opened via URL parameters
      navigate("/?signup=true");
    }
  }, [isAuthenticated, user, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="text-center">
        <p>Redirecting to signup...</p>
      </div>
    </div>
  );
};

export default Signup;
