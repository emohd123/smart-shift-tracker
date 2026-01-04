import { useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import { useResponsive } from "@/hooks/useResponsive";
import { CompanyInfoTab, DocumentsTab, SettingsTab, AccountTab } from "./tabs";
import { Building2, FileText, Settings, Trash2 } from "lucide-react";

export default function CompanyProfileManager() {
  const { isMobile } = useResponsive();
  const [activeTab, setActiveTab] = useState("company");
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    setIsLoaded(true);
  }, []);

  return (
    <div className={`space-y-6 transition-opacity duration-300 ${isLoaded ? 'opacity-100' : 'opacity-0'}`}>
      <div className="mb-6">
        <h1 className="text-3xl font-bold tracking-tight">Company Profile & Settings</h1>
        <p className="text-muted-foreground mt-1">
          Manage your company information, documents, settings and account.
        </p>
      </div>

      <Tabs 
        defaultValue="company" 
        value={activeTab}
        onValueChange={setActiveTab}
        className="w-full"
      >
        <TabsList 
          className={`grid w-full md:w-auto grid-cols-4 ${isMobile ? 'sticky top-0 z-10 bg-background/80 backdrop-blur-sm' : ''}`}
        >
          <TabsTrigger value="company" className="gap-2 data-[state=active]:shadow-sm">
            <Building2 className="h-4 w-4" />
            {!isMobile && "Company"}
          </TabsTrigger>
          <TabsTrigger value="documents" className="gap-2 data-[state=active]:shadow-sm">
            <FileText className="h-4 w-4" />
            {!isMobile && "Documents"}
          </TabsTrigger>
          <TabsTrigger value="settings" className="gap-2 data-[state=active]:shadow-sm">
            <Settings className="h-4 w-4" />
            {!isMobile && "Settings"}
          </TabsTrigger>
          <TabsTrigger value="account" className="gap-2 data-[state=active]:shadow-sm">
            <Trash2 className="h-4 w-4" />
            {!isMobile && "Account"}
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="company" className="mt-6 animate-fade-in">
          <CompanyInfoTab />
        </TabsContent>
        
        <TabsContent value="documents" className="mt-6 animate-fade-in">
          <DocumentsTab />
        </TabsContent>
        
        <TabsContent value="settings" className="mt-6 animate-fade-in">
          <SettingsTab />
        </TabsContent>
        
        <TabsContent value="account" className="mt-6 animate-fade-in">
          <Card className="p-6">
            <AccountTab />
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
