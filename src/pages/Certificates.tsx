
import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import AppLayout from "@/components/layout/AppLayout";
import WorkCertificateGenerator from "@/components/certificates/WorkCertificateGenerator";
import MyCertificates from "@/components/certificates/MyCertificates";
import { useAuth } from "@/context/AuthContext";
import { Award, FileText } from "lucide-react";

export default function Certificates() {
  const [activeTab, setActiveTab] = useState("generator");
  const { user } = useAuth();
  
  return (
    <AppLayout title="Certificates">
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold mb-2">Work Certificates</h1>
          <p className="text-muted-foreground">
            Generate and manage your work performance certificates
          </p>
        </div>
        
        <Tabs defaultValue="generator" value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-8">
            <TabsTrigger value="generator" className="flex items-center gap-2">
              <Award className="h-4 w-4" />
              Generate Certificate
            </TabsTrigger>
            <TabsTrigger value="my-certificates" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              My Certificates
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="generator">
            <WorkCertificateGenerator />
          </TabsContent>
          
          <TabsContent value="my-certificates">
            <MyCertificates />
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
}
