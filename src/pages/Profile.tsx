
import { useState, useEffect } from "react";
import AppLayout from "@/components/layout/AppLayout";
import ProfileUpdateForm from "@/components/profile/ProfileUpdateForm";
import { UniqueCodeCard } from "@/components/profile/UniqueCodeCard";
import CompanyProfileManager from "@/components/company-profile/CompanyProfileManager";
import PasswordChangeForm from "@/components/profile/PasswordChangeForm";
import AccountRemovalForm from "@/components/profile/AccountRemovalForm";
import { useAuth } from "@/context/AuthContext";
import { useNavigate } from "react-router-dom";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import { CheckCircle2, Clock, XCircle } from "lucide-react";
import { ProfileChangeRequests } from "@/components/profile/ProfileChangeRequests";

// Get status badge styling based on verification status
const getStatusConfig = (status: string | undefined) => {
  switch (status?.toLowerCase()) {
    case 'approved':
      return {
        color: 'bg-green-50 text-green-700 border-green-200',
        icon: CheckCircle2,
        label: 'Approved'
      };
    case 'pending':
      return {
        color: 'bg-yellow-50 text-yellow-700 border-yellow-200',
        icon: Clock,
        label: 'Pending Approval'
      };
    case 'rejected':
      return {
        color: 'bg-red-50 text-red-700 border-red-200',
        icon: XCircle,
        label: 'Rejected'
      };
    default:
      return {
        color: 'bg-gray-50 text-gray-700 border-gray-200',
        icon: Clock,
        label: 'Unknown'
      };
  }
};

export default function Profile() {
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("profile");

  useEffect(() => {
    // Only redirect if auth has finished loading and user is not authenticated
    if (!authLoading && !isAuthenticated) {
      navigate("/login");
    }
  }, [authLoading, isAuthenticated, navigate]);

  // Show loading state while auth is initializing
  if (authLoading) {
    return (
      <AppLayout title="Profile">
        <div className="flex justify-center items-center h-64">
          <div className="animate-pulse text-primary">Loading your profile...</div>
        </div>
      </AppLayout>
    );
  }

  // Don't render anything if not authenticated (will redirect)
  if (!isAuthenticated) {
    return null;
  }

  // Show company profile for company users
  if (user?.role === "company") {
    return (
      <AppLayout title="Company Profile & Settings">
        <div className="space-y-6">
          <Separator />
          {/* Profile Change Requests - Show at top if any exist */}
          <ProfileChangeRequests />
          <CompanyProfileManager />
        </div>
      </AppLayout>
    );
  }

  // Show promoter profile with settings tabs
  const statusConfig = getStatusConfig(user?.verification_status);
  const StatusIcon = statusConfig.icon;

  return (
    <AppLayout title="Profile & Settings">
      <div className="max-w-3xl mx-auto py-8 px-4">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold tracking-tight">My Profile</h1>
          {/* Verification Status Badge */}
          <Badge variant="outline" className={`${statusConfig.color} flex items-center gap-1.5 px-3 py-1.5`}>
            <StatusIcon className="h-4 w-4" />
            {statusConfig.label}
          </Badge>
        </div>

        {/* Unique Code Card - Only for Promoters */}
        <UniqueCodeCard user={user} />

        {/* Profile Change Requests - Show at top if any exist */}
        <ProfileChangeRequests />

        {/* Tabs for Profile, Password, and Account Settings */}
        <div className="mt-8">
          <Tabs 
            defaultValue="profile" 
            value={activeTab}
            onValueChange={setActiveTab}
            className="w-full"
          >
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="profile" className="data-[state=active]:shadow-sm">Profile</TabsTrigger>
              <TabsTrigger value="password" className="data-[state=active]:shadow-sm">Password</TabsTrigger>
              <TabsTrigger value="account" className="data-[state=active]:shadow-sm">Account</TabsTrigger>
            </TabsList>
            
            <TabsContent value="profile" className="mt-6 animate-fade-in">
              <ProfileUpdateForm />
            </TabsContent>
            
            <TabsContent value="password" className="mt-6 animate-fade-in">
              <PasswordChangeForm />
            </TabsContent>
            
            <TabsContent value="account" className="mt-6 animate-fade-in">
              <Card className="p-6">
                <AccountRemovalForm />
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </AppLayout>
  );
}
