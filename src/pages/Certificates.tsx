
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft } from "lucide-react";
import AppLayout from "@/components/layout/AppLayout";
import EnhancedWorkCertificateGenerator from "@/components/certificates/EnhancedWorkCertificateGenerator";
import MyCertificates from "@/components/certificates/MyCertificates";
import { useAuth } from "@/context/AuthContext";
import { Award, FileText, HelpCircle, Shield, BookOpen, Medal } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription } from "@/components/ui/card";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Badge } from "@/components/ui/badge";

export default function Certificates() {
  const [activeTab, setActiveTab] = useState("generator");
  const { user } = useAuth();
  const navigate = useNavigate();
  
  return (
    <AppLayout title="Professional Certificates">
      <div className="space-y-8">
        {/* Enhanced header with gradient text and badge */}
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
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
                Professional Work Certificates
              </h1>
              <p className="text-muted-foreground mt-1 max-w-2xl">
                Create verified certificates that showcase your professional experience
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <Badge variant="outline" className="px-3 py-1 border-primary/30 bg-primary/5">
              <Shield className="h-3.5 w-3.5 mr-1 text-primary" />
              Official Certification
            </Badge>
            
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
        </div>
        
        <Separator className="my-4" />
        
        {/* Feature highlights */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <Card className="bg-primary/5 border-primary/20">
            <CardContent className="p-4 flex items-start gap-3">
              <div className="mt-1 bg-primary/10 p-2 rounded-full">
                <Medal className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h3 className="font-medium">Verified Credentials</h3>
                <CardDescription>Each certificate has a unique verification code</CardDescription>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-primary/5 border-primary/20">
            <CardContent className="p-4 flex items-start gap-3">
              <div className="mt-1 bg-primary/10 p-2 rounded-full">
                <Shield className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h3 className="font-medium">Digital Signature</h3>
                <CardDescription>Tamper-proof design with secure authentication</CardDescription>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-primary/5 border-primary/20">
            <CardContent className="p-4 flex items-start gap-3">
              <div className="mt-1 bg-primary/10 p-2 rounded-full">
                <BookOpen className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h3 className="font-medium">Shareable Format</h3>
                <CardDescription>Easy to share digitally or as printed document</CardDescription>
              </div>
            </CardContent>
          </Card>
        </div>
        
        <Tabs 
          defaultValue="generator" 
          value={activeTab} 
          onValueChange={setActiveTab}
          className="w-full"
        >
          <TabsList className="mb-8 grid grid-cols-2 w-full max-w-md mx-auto bg-secondary/50">
            <TabsTrigger value="generator" className="flex items-center gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              <Award className="h-4 w-4" />
              Generate Certificate
            </TabsTrigger>
            <TabsTrigger value="my-certificates" className="flex items-center gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              <FileText className="h-4 w-4" />
              My Certificates
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="generator" className="focus-visible:outline-none focus-visible:ring-0">
            <EnhancedWorkCertificateGenerator />
          </TabsContent>
          
          <TabsContent value="my-certificates" className="focus-visible:outline-none focus-visible:ring-0">
            <MyCertificates />
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
}
