import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CheckCircle, Image, BarChart3 } from "lucide-react";
import CompanyShiftApproval from "./CompanyShiftApproval";
import CompanyLogoUpload from "./CompanyLogoUpload";
import CertificateAnalytics from "./CertificateAnalytics";

export default function CompanyCertificatesPage() {
  return (
    <div className="space-y-6">
      <Tabs defaultValue="approvals" className="w-full">
        <TabsList className="grid grid-cols-3 w-full max-w-2xl mx-auto bg-secondary/50 p-1.5">
          <TabsTrigger value="approvals" className="flex items-center gap-2 text-sm">
            <CheckCircle className="h-4 w-4" />
            <span className="hidden sm:inline">Shift Approvals</span>
            <span className="sm:hidden">Approvals</span>
          </TabsTrigger>
          <TabsTrigger value="logo" className="flex items-center gap-2 text-sm">
            <Image className="h-4 w-4" />
            <span className="hidden sm:inline">Company Logo</span>
            <span className="sm:hidden">Logo</span>
          </TabsTrigger>
          <TabsTrigger value="analytics" className="flex items-center gap-2 text-sm">
            <BarChart3 className="h-4 w-4" />
            <span className="hidden sm:inline">Analytics</span>
            <span className="sm:hidden">Stats</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="approvals" className="mt-6">
          <CompanyShiftApproval />
        </TabsContent>

        <TabsContent value="logo" className="mt-6">
          <CompanyLogoUpload />
        </TabsContent>

        <TabsContent value="analytics" className="mt-6">
          <CertificateAnalytics />
        </TabsContent>
      </Tabs>
    </div>
  );
}
