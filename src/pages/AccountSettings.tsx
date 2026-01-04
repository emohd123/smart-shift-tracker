
import AppLayout from "@/components/layout/AppLayout";
import AccountSettingsLayout from "@/components/profile/AccountSettingsLayout";
import CompanyProfileManager from "@/components/company-profile/CompanyProfileManager";
import { Separator } from "@/components/ui/separator";
import { useAuth } from "@/context/AuthContext";

export default function AccountSettings() {
  const { user } = useAuth();

  // Show company profile manager for company users
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

  // Show regular settings for promoters and admins
  return (
    <AppLayout title="Account Settings">
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Account Settings</h1>
          <p className="text-muted-foreground mt-1">
            Manage your account settings and profile information.
          </p>
        </div>
        <Separator />
        <AccountSettingsLayout />
      </div>
    </AppLayout>
  );
}
