
import AppLayout from "@/components/layout/AppLayout";
import AccountSettingsLayout from "@/components/profile/AccountSettingsLayout";
import { Separator } from "@/components/ui/separator";

export default function AccountSettings() {
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
