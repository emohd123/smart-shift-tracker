import AppLayout from "@/components/layout/AppLayout";
import CompanyProfileManager from "@/components/company-profile/CompanyProfileManager";
import { Separator } from "@/components/ui/separator";

export default function CompanyProfilePage() {
  return (
    <AppLayout title="Company Profile & Settings">
      <div className="space-y-6">
        <Separator />
        <CompanyProfileManager />
      </div>
    </AppLayout>
  );
}
