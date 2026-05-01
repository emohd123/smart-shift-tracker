import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";
import { Shield, CheckCircle, Download, Share2, Mail, Eye, Settings } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import AdminCertificateSelector from "./AdminCertificateSelector";
import TimePeriodSelector from "./generator/TimePeriodSelector";
import { ShiftSelector } from "./generator/ShiftSelector";
import { CertificateCustomizer } from "./generator/CertificateCustomizer";
import { EnhancedCertificatePreview } from "./EnhancedCertificatePreview";
import { AdminStampConfig } from "./generator/AdminStampConfig";
import { CompanyStampConfig } from "./generator/CompanyStampConfig";
import { TimePeriod, CertificateType, WorkExperienceData } from "./types/certificate";
import { useUnifiedCertificateGeneration } from "./hooks/useUnifiedCertificateGeneration";
import { useCertificatePayment } from "@/hooks/useCertificatePayment";
import PaymentButton from "./generator/PaymentButton";
import GenerateButton from "./generator/GenerateButton";
import { isAdminLike } from "@/utils/roleUtils";

export default function EnhancedWorkCertificateGenerator() {
  const { user, isAuthenticated } = useAuth();
  const [timePeriod, setTimePeriod] = useState<TimePeriod>("6months");
  const [selectedUserId, setSelectedUserId] = useState<string>("");
  const [selectedShifts, setSelectedShifts] = useState<string[]>([]);
  const [showPreview, setShowPreview] = useState(false);
  const [certificateTemplate, setCertificateTemplate] = useState("professional");
  const [includeDescription, setIncludeDescription] = useState(true);
  const [includeMetrics, setIncludeMetrics] = useState(true);
  const [customMessage, setCustomMessage] = useState("");
  const [promoters, setPromoters] = useState<any[]>([]);
  const [loadingPromoters, setLoadingPromoters] = useState(false);
  const [generatedCertificateId, setGeneratedCertificateId] = useState<string | null>(null);
  
  const {
    generateCertificate,
    certificateData,
    loading,
    downloading,
    sharing,
    fetchPromoters,
    handleDownload,
    handleShare,
    handleEmail
  } = useUnifiedCertificateGeneration(selectedUserId || user?.id || "", timePeriod, "work_experience");
  
  const {
    isProcessing,
    checkPaymentStatus,
    initiateCertificatePayment,
  } = useCertificatePayment();
  
  // Set initial user ID
  useEffect(() => {
    if (user) {
      setSelectedUserId(user.id);
    }
  }, [user]);
  
  // Fetch promoters if user is admin
  useEffect(() => {
    if (isAdminLike(user?.role)) {
      const loadPromoters = async () => {
        setLoadingPromoters(true);
        try {
          const promotersList = await fetchPromoters();
          setPromoters(promotersList || []);
        } catch (error) {
          console.error("Failed to load promoters:", error);
          toast.error("Failed to load promoters list");
        } finally {
          setLoadingPromoters(false);
        }
      };
      
      loadPromoters();
    }
  }, [user, fetchPromoters]);
  
  const handleGenerate = async () => {
    if (!isAuthenticated) {
      toast.error("Please login to generate certificates");
      return;
    }
    
    if (!selectedUserId && isAdminLike(user?.role)) {
      toast.error("Please select a promoter");
      return;
    }
    
    if (selectedShifts.length === 0) {
      toast.error("Please select at least one shift");
      return;
    }
    
    setShowPreview(false);
    
    try {
      const result = await generateCertificate();
      if (result && result.certificateId) {
        setGeneratedCertificateId(result.certificateId);
      }
      setShowPreview(true);
      toast.success("Certificate generated! Please proceed with payment to download.");
    } catch (error) {
      console.error("Failed to generate certificate:", error);
      toast.error("Failed to generate certificate. Please try again.");
    }
  };

  const handlePayment = async () => {
    if (!generatedCertificateId) {
      toast.error("Please generate a certificate first");
      return;
    }
    
    await initiateCertificatePayment(generatedCertificateId);
  };

  return (
    <div className="w-full max-w-6xl mx-auto space-y-6">
      <Card className="border border-primary/20">
        <CardHeader className="bg-gradient-to-r from-primary/5 to-primary/10">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-3xl font-bold flex items-center gap-3">
                <Shield className="h-8 w-8 text-primary" />
                Enhanced Work Certificate Generator
              </CardTitle>
              <CardDescription className="mt-2 text-base">
                Generate comprehensive work certificates with selective shift history, detailed descriptions, and professional branding
              </CardDescription>
            </div>
            <Badge variant="outline" className="px-4 py-2 border-primary/30 bg-primary/5">
              <CheckCircle className="h-4 w-4 mr-2 text-primary" />
              Professional Document
            </Badge>
          </div>
        </CardHeader>
        
        <CardContent className="p-6">
          {!isAuthenticated && (
            <Alert variant="destructive" className="mb-6">
              <AlertTitle>Authentication Required</AlertTitle>
              <AlertDescription>
                You need to be logged in to generate and download certificates.
              </AlertDescription>
            </Alert>
          )}
          
          <Tabs defaultValue="generate" className="w-full">
            <TabsList className="grid w-full grid-cols-3 mb-6">
              <TabsTrigger value="generate">Generate Certificate</TabsTrigger>
              <TabsTrigger value="customize">Customize Design</TabsTrigger>
              {(isAdminLike(user?.role) || user?.role === 'company') && (
                <TabsTrigger value="settings">
                  {isAdminLike(user?.role) ? 'Admin Settings' : 'Company Settings'}
                </TabsTrigger>
              )}
            </TabsList>
            
            <TabsContent value="generate" className="space-y-6">
              {/* Admin can select a user */}
              {isAdminLike(user?.role) && (
                <AdminCertificateSelector
                  selectedUserId={selectedUserId}
                  setSelectedUserId={setSelectedUserId}
                  promoters={promoters}
                  loadingPromoters={loadingPromoters}
                />
              )}
              
              <TimePeriodSelector 
                timePeriod={timePeriod} 
                setTimePeriod={setTimePeriod} 
              />
              
              <ShiftSelector
                userId={selectedUserId || user?.id || ""}
                timePeriod={timePeriod}
                selectedShifts={selectedShifts}
                setSelectedShifts={setSelectedShifts}
              />
              
              <div className="flex justify-center">
                <Button 
                  onClick={handleGenerate}
                  disabled={loading || !user || (isAdminLike(user.role) && selectedUserId === "") || selectedShifts.length === 0}
                  size="lg"
                  className="px-8 py-3 text-lg"
                >
                  {loading ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
                      Generating Certificate...
                    </>
                  ) : (
                    <>
                      <Shield className="h-5 w-5 mr-2" />
                      Generate Enhanced Certificate
                    </>
                  )}
                </Button>
              </div>
            </TabsContent>
            
            <TabsContent value="customize" className="space-y-6">
              <CertificateCustomizer
                template={certificateTemplate}
                setTemplate={setCertificateTemplate}
                includeDescription={includeDescription}
                setIncludeDescription={setIncludeDescription}
                includeMetrics={includeMetrics}
                setIncludeMetrics={setIncludeMetrics}
                customMessage={customMessage}
                setCustomMessage={setCustomMessage}
              />
            </TabsContent>
            
            {isAdminLike(user?.role) && (
              <TabsContent value="settings" className="space-y-6">
                <AdminStampConfig />
              </TabsContent>
            )}

            {user?.role === 'company' && (
              <TabsContent value="settings" className="space-y-6">
                <CompanyStampConfig />
              </TabsContent>
            )}
          </Tabs>
        </CardContent>
      </Card>
      
      {showPreview && certificateData && (
        <Card className="border border-primary/20">
          <CardHeader className="bg-secondary/30">
            <CardTitle className="text-xl font-bold flex items-center gap-2">
              <Eye className="h-5 w-5 text-primary" />
              Certificate Preview
            </CardTitle>
            <CardDescription>
              Review your enhanced work certificate before downloading
            </CardDescription>
          </CardHeader>
          
          <CardContent className="p-6">
            <EnhancedCertificatePreview 
              certificateData={certificateData}
              template={certificateTemplate}
            />
            
            <div className="flex flex-wrap gap-3 justify-center mt-8">
              <Button 
                onClick={handleDownload}
                disabled={downloading}
                size="lg"
                className="px-6"
              >
                {downloading ? (
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
                ) : (
                  <Download className="h-4 w-4 mr-2" />
                )}
                Download PDF
              </Button>
              
              <Button 
                onClick={handleShare}
                disabled={sharing}
                variant="outline"
                size="lg"
                className="px-6"
              >
                {sharing ? (
                  <div className="w-4 h-4 border-2 border-primary/30 border-t-primary rounded-full animate-spin mr-2" />
                ) : (
                  <Share2 className="h-4 w-4 mr-2" />
                )}
                Share Certificate
              </Button>
              
              <Button 
                onClick={handleEmail}
                variant="outline"
                size="lg"
                className="px-6"
              >
                <Mail className="h-4 w-4 mr-2" />
                Email Certificate
              </Button>
              
              <Button 
                onClick={() => window.open(`/verify-certificate/${certificateData.referenceNumber}`, '_blank')}
                variant="outline"
                size="lg"
                className="px-6"
              >
                <Eye className="h-4 w-4 mr-2" />
                View QR Code
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}