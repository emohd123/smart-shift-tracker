
import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
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
import { toast } from "sonner";

export default function Certificates() {
  const [activeTab, setActiveTab] = useState("generator");
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  
  // Handle Stripe success redirect
  useEffect(() => {
    const success = searchParams.get('success');
    const canceled = searchParams.get('canceled');
    
    if (success === 'true') {
      toast.success("Payment successful! You can now download your certificate.");
      setActiveTab("my-certificates");
      // Clean up URL
      window.history.replaceState({}, '', '/certificates');
    } else if (canceled === 'true') {
      toast.info("Payment was canceled. You can try again anytime.");
      // Clean up URL
      window.history.replaceState({}, '', '/certificates');
    }
  }, [searchParams]);
  
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
        
        {/* Feature highlights - Mobile responsive */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 mb-6">
          <Card className="bg-primary/5 border-primary/20">
            <CardContent className="p-3 sm:p-4 flex items-start gap-2 sm:gap-3">
              <div className="mt-0.5 sm:mt-1 bg-primary/10 p-1.5 sm:p-2 rounded-full flex-shrink-0">
                <Medal className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
              </div>
              <div className="min-w-0">
                <h3 className="font-medium text-sm sm:text-base">Verified Credentials</h3>
                <CardDescription className="text-xs sm:text-sm">Unique verification code</CardDescription>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-primary/5 border-primary/20">
            <CardContent className="p-3 sm:p-4 flex items-start gap-2 sm:gap-3">
              <div className="mt-0.5 sm:mt-1 bg-primary/10 p-1.5 sm:p-2 rounded-full flex-shrink-0">
                <Shield className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
              </div>
              <div className="min-w-0">
                <h3 className="font-medium text-sm sm:text-base">Digital Signature</h3>
                <CardDescription className="text-xs sm:text-sm">Tamper-proof & secure</CardDescription>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-primary/5 border-primary/20 sm:col-span-2 lg:col-span-1">
            <CardContent className="p-3 sm:p-4 flex items-start gap-2 sm:gap-3">
              <div className="mt-0.5 sm:mt-1 bg-primary/10 p-1.5 sm:p-2 rounded-full flex-shrink-0">
                <BookOpen className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
              </div>
              <div className="min-w-0">
                <h3 className="font-medium text-sm sm:text-base">$4.99 Per Certificate</h3>
                <CardDescription className="text-xs sm:text-sm">Pay once, download forever</CardDescription>
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
          <TabsList className="mb-6 sm:mb-8 grid grid-cols-2 w-full max-w-md mx-auto bg-secondary/50">
            <TabsTrigger value="generator" className="flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm data-[state=active]:bg-primary data-[state=active]:text-primary-foreground py-2 sm:py-2.5">
              <Award className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              <span className="hidden sm:inline">Generate Certificate</span>
              <span className="sm:hidden">Generate</span>
            </TabsTrigger>
            <TabsTrigger value="my-certificates" className="flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm data-[state=active]:bg-primary data-[state=active]:text-primary-foreground py-2 sm:py-2.5">
              <FileText className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              <span className="hidden sm:inline">My Certificates</span>
              <span className="sm:hidden">My Certs</span>
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
