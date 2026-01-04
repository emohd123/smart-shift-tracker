
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";

export default function AccountSettings() {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    // Redirect to profile page (which now includes all settings)
    navigate("/profile");
  }, [navigate, isAuthenticated]);

  return null;
}
