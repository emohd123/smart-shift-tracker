import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { ArrowLeft, HelpCircle, Shield, Medal, BookOpen, Crown, Sparkles } from "lucide-react";
import AppLayout from "@/components/layout/AppLayout";
import { useAuth } from "@/context/AuthContext";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription } from "@/components/ui/card";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import CompanyCertificatesPage from "@/components/certificates/company/CompanyCertificatesPage";
import PromoterCertificatesPage from "@/components/certificates/promoter/PromoterCertificatesPage";
import AdminCertificatesPage from "@/components/certificates/admin/AdminCertificatesPage";
import { isAdminLike } from "@/utils/roleUtils";

export default function Certificates() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  
  // Handle Stripe success redirect for promoters
  useEffect(() => {
    const success = searchParams.get('success');
    const canceled = searchParams.get('canceled');
    
    if (success === 'true') {
      toast.success("Payment successful! You can now download your certificate.");
      // Clean up URL
      window.history.replaceState({}, '', '/certificates');
    } else if (canceled === 'true') {
      toast.info("Payment was canceled. You can try again anytime.");
      // Clean up URL
      window.history.replaceState({}, '', '/certificates');
    }
  }, [searchParams]);

  const isAdmin = isAdminLike(user?.role);
  const isCompany = user?.role === 'company';
  const isPromoter = user?.role === 'promoter';
  
  const getTitle = () => {
    if (isAdmin) return 'Certificate Administration';
    if (isCompany) return 'Certificate Management';
    return 'Professional Work Certificates';
  };
  
  const getDescription = () => {
    if (isAdmin) return 'Full administrative access to all certificate features - Generate, manage, and verify certificates for free';
    if (isCompany) return 'Approve completed shifts to allow promoters to generate certificates';
    return 'Create verified certificates that showcase your professional experience';
  };
  
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
              <div className="flex items-center gap-2">
                <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
                  {getTitle()}
                </h1>
                {isAdmin && (
                  <Badge className="bg-gradient-to-r from-amber-500 to-orange-500 text-white border-0">
                    <Crown className="h-3 w-3 mr-1" />
                    Super Admin
                  </Badge>
                )}
              </div>
              <p className="text-muted-foreground mt-1 max-w-2xl">
                {getDescription()}
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            {isAdmin && (
              <Badge variant="outline" className="px-3 py-1 border-amber-500/30 bg-amber-500/10 text-amber-600">
                <Sparkles className="h-3.5 w-3.5 mr-1" />
                Free Access
              </Badge>
            )}
            <Badge variant="outline" className="px-3 py-1 border-primary/30 bg-primary/5">
              <Shield className="h-3.5 w-3.5 mr-1 text-primary" />
              Official Certification
            </Badge>
            
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="outline" size="sm" className="flex items-center gap-2">
                    <HelpCircle className="h-4 w-4" />
                    Guide
                  </Button>
                </TooltipTrigger>
                <TooltipContent className="max-w-sm p-4">
                  <p className="text-sm">
                    {isAdmin 
                      ? 'As Super Admin, you have full access to generate, manage, and verify all certificates at no cost. Use the admin panel to manage certificates for any user.'
                      : isCompany 
                        ? 'Approve completed shifts to enable promoters to generate professional certificates. Your company logo and details will appear on their certificates.'
                        : 'Each certificate includes a unique reference number, QR verification code, and official digital signature to ensure authenticity with potential employers.'
                    }
                  </p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </div>
        
        <Separator className="my-4" />
        
        {/* Admin Feature Panel */}
        {isAdmin && (
          <Card className="border-2 border-amber-500/30 bg-gradient-to-r from-amber-500/5 via-orange-500/5 to-amber-500/5">
            <CardContent className="p-6">
              <div className="flex items-center gap-4 mb-4">
                <div className="bg-gradient-to-r from-amber-500 to-orange-500 p-3 rounded-full">
                  <Crown className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-bold">Super Admin Privileges</h3>
                  <p className="text-muted-foreground">Full control over certificate system</p>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="flex items-center gap-3 p-3 bg-background/50 rounded-lg">
                  <Sparkles className="h-5 w-5 text-amber-500" />
                  <div>
                    <p className="font-medium">Free Generation</p>
                    <p className="text-xs text-muted-foreground">No charges applied</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 bg-background/50 rounded-lg">
                  <Shield className="h-5 w-5 text-amber-500" />
                  <div>
                    <p className="font-medium">Instant Verification</p>
                    <p className="text-xs text-muted-foreground">Skip approval workflow</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 bg-background/50 rounded-lg">
                  <Medal className="h-5 w-5 text-amber-500" />
                  <div>
                    <p className="font-medium">All User Access</p>
                    <p className="text-xs text-muted-foreground">Generate for any promoter</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
        
        {/* Feature highlights - Only for promoters */}
        {isPromoter && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
            <Card className="bg-primary/5 border-primary/20">
              <CardContent className="p-4 sm:p-5 flex items-start gap-3 min-h-[80px]">
                <div className="bg-primary/10 p-2.5 rounded-full flex-shrink-0">
                  <Medal className="h-5 w-5 text-primary" />
                </div>
                <div className="min-w-0">
                  <h3 className="font-semibold text-base mb-1">Verified Credentials</h3>
                  <CardDescription className="text-sm">Unique verification code</CardDescription>
                </div>
              </CardContent>
            </Card>
            
            <Card className="bg-primary/5 border-primary/20">
              <CardContent className="p-4 sm:p-5 flex items-start gap-3 min-h-[80px]">
                <div className="bg-primary/10 p-2.5 rounded-full flex-shrink-0">
                  <Shield className="h-5 w-5 text-primary" />
                </div>
                <div className="min-w-0">
                  <h3 className="font-semibold text-base mb-1">Digital Signature</h3>
                  <CardDescription className="text-sm">Tamper-proof & secure</CardDescription>
                </div>
              </CardContent>
            </Card>
            
            <Card className="bg-primary/5 border-primary/20 sm:col-span-2 lg:col-span-1">
              <CardContent className="p-4 sm:p-5 flex items-start gap-3 min-h-[80px]">
                <div className="bg-primary/10 p-2.5 rounded-full flex-shrink-0">
                  <BookOpen className="h-5 w-5 text-primary" />
                </div>
                <div className="min-w-0">
                  <h3 className="font-semibold text-base mb-1">$4.99 Per Certificate</h3>
                  <CardDescription className="text-sm">Pay once, download forever</CardDescription>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
        
        {/* Role-based content */}
        {isAdmin ? (
          <AdminCertificatesPage />
        ) : isCompany ? (
          <CompanyCertificatesPage />
        ) : (
          <PromoterCertificatesPage />
        )}
      </div>
    </AppLayout>
  );
}
