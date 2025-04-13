
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft } from "lucide-react";
import AppLayout from "@/components/layout/AppLayout";
import WorkCertificateGenerator from "@/components/certificates/WorkCertificateGenerator";
import MyCertificates from "@/components/certificates/MyCertificates";
import { useAuth } from "@/context/AuthContext";
import { Award, FileText, HelpCircle } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

export default function Certificates() {
  const [activeTab, setActiveTab] = useState("generator");
  const { user } = useAuth();
  const navigate = useNavigate();
  
  return (
    <AppLayout title="Professional Certificates">
      <div className="space-y-8">
        <div className="flex flex-wrap justify-between items-start gap-4">
          <div className="flex items-center gap-4">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => navigate(-1)}
              className="group hover:bg-primary/10"
            >
              <ArrowLeft 
                size={16} 
                className="mr-2 group-hover:-translate-x-1 transition-transform" 
              />
              Back
            </Button>
            <h1 className="text-3xl font-bold">Professional Work Certificates</h1>
          </div>
          
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="outline" size="sm" className="flex items-center gap-2">
                  <HelpCircle className="h-4 w-4" />
                  Certificate Guide
                </Button>
              </TooltipTrigger>
              <TooltipContent className="max-w-sm p-4">
                <p className="text-sm">
                  Each certificate includes a unique reference number, QR verification code, 
                  and official digital signature to ensure authenticity with potential employers.
                </p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
        
        <Separator className="my-4" />
        
        <Tabs defaultValue="generator" value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-8 grid grid-cols-2 w-full max-w-md">
            <TabsTrigger value="generator" className="flex items-center gap-2">
              <Award className="h-4 w-4" />
              Generate Certificate
            </TabsTrigger>
            <TabsTrigger value="my-certificates" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              My Certificates
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="generator" className="focus-visible:outline-none focus-visible:ring-0">
            <WorkCertificateGenerator />
          </TabsContent>
          
          <TabsContent value="my-certificates" className="focus-visible:outline-none focus-visible:ring-0">
            <MyCertificates />
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
}
