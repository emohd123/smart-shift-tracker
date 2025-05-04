
import { useState, useEffect } from "react";
import AppLayout from "@/components/layout/AppLayout";
import ProfileUpdateForm from "@/components/profile/ProfileUpdateForm";
import { useAuth } from "@/context/AuthContext";
import { useNavigate } from "react-router-dom";

export default function Profile() {
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Add a small delay to ensure auth state is loaded
    const timer = setTimeout(() => {
      if (!isAuthenticated) {
        navigate("/login");
      }
      setLoading(false);
    }, 500);

    return () => clearTimeout(timer);
  }, [isAuthenticated, navigate]);

  if (loading) {
    return (
      <AppLayout title="Profile">
        <div className="flex justify-center items-center h-64">
          <div className="animate-pulse text-primary">Loading your profile...</div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout title="Profile">
      <div className="max-w-3xl mx-auto py-8 px-4">
        <h1 className="text-3xl font-bold tracking-tight mb-6">My Profile</h1>
        <ProfileUpdateForm />
      </div>
    </AppLayout>
  );
}
