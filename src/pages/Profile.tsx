
import { useState, useEffect } from "react";
import AppLayout from "@/components/layout/AppLayout";
import ProfileUpdateForm from "@/components/profile/ProfileUpdateForm";
import { UniqueCodeCard } from "@/components/profile/UniqueCodeCard";
import CompanyProfileManager from "@/components/company-profile/CompanyProfileManager";
import { useAuth } from "@/context/AuthContext";
import { useNavigate } from "react-router-dom";
import { Separator } from "@/components/ui/separator";

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

  // Show company profile for company users
  if (user?.role === "company") {
    return (
      <AppLayout title="Company Profile & Settings">
        <div className="space-y-6">
          <Separator />
          <CompanyProfileManager />
        </div>
      </AppLayout>
    );
  }

  // Show promoter profile for promoters
  return (
    <AppLayout title="Profile">
      <div className="max-w-3xl mx-auto py-8 px-4">
        <h1 className="text-3xl font-bold tracking-tight mb-6">My Profile</h1>
        
        {/* Unique Code Card - Only for Promoters */}
        <UniqueCodeCard user={user} />
        
        <ProfileUpdateForm />
      </div>
    </AppLayout>
  );
}
