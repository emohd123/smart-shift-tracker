import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { useAuth } from "@/context/AuthContext";
import { Shield, Download, Share2, Mail, Eye, CheckCircle, Lock } from "lucide-react";
import { TimePeriod, CertificateType } from "./types/certificate";
import { useUnifiedCertificateGeneration } from "./hooks/useUnifiedCertificateGeneration";
import { isAdminLike } from "@/utils/role";
import { AdminCertificateSelector } from "./AdminCertificateSelector";
import { TimePeriodSelector } from "./TimePeriodSelector";
import { ShiftSelector } from "./ShiftSelector";
import { EnhancedCertificatePreview } from "./EnhancedCertificatePreview";
import { CertificateCustomizer } from "./CertificateCustomizer";
import { AdminStampConfig } from "./AdminStampConfig";
import { CompanyStampConfig } from "./CompanyStampConfig";
import { useCertificatePayment } from "@/hooks/useCertificatePayment";
import { toast } from "sonner";

interface EnhancedWorkCertificateGeneratorProps {
  userId?: string;
  certificateType?: CertificateType;
}

export function EnhancedWorkCertificateGenerator({ 
  userId: initialUserId, 
  certificateType = "work_experience" 
}: EnhancedWorkCertificateGeneratorProps) {
  const { user } = useAuth();
  const [timePeriod, setTimePeriod] = useState<TimePeriod>("all");
  const [selectedShifts, setSelectedShifts] = useState<string[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<string>(initialUserId || "");
  const [showPreview, setShowPreview] = useState(false);
  const [certificateId, setCertificateId] = useState<string | null>(null);

  const [certificateTemplate, setCertificateTemplate] = useState("standard");
  const [includeDescription, setIncludeDescription] = useState(true);
  const [includeMetrics, setIncludeMetrics] = useState(true);
  const [customMessage, setCustomMessage] = useState("");

  const isAdmin = isAdminLike(user?.role);
  const isPromoter = user?.role === 'promoter' || user?.role === 'part_timer';

  const { 
    generateCertificate, 
    certificateData, 
    loading, 
    downloading, 
    sharing,
    handleDownload, 
    handleShare, 
    handleEmail,
    fetchPromoters,
  } = useUnifiedCertificateGeneration(
    selectedUserId || user?.id || "", 
    timePeriod, 
    certificateType
  );

  const { initiateCertificatePayment, loadingPayment } = useCertificatePayment();

  const [promoters, setPromoters] = useState<any[]>([]);
  const [loadingPromoters, setLoadingPromoters] = useState(false);

  const loadPromoters = async () => {
    setLoadingPromoters(true);
    try {
      const data = await fetchPromoters();
      setPromoters(data || []);
    } catch (error) {
      console.error("Failed to load promoters:", error);
    } finally {
      setLoadingPromoters(false);
    }
  };

  useState(() => {
    if (isAdminLike(user?.role)) {
      loadPromoters();
    }
  });

  const handleGenerate = async () => {
    try {
      const result = await generateCertificate();
      if (result && result.certificateId) {
        setCertificateId(result.certificateId);
        setShowPreview(true);

        if (isAdmin) {
          toast.success("Certificate generated successfully! Download is free for admin.");
        } else if (isPromoter) {
          toast.info("Certificate generated. Complete payment to download.");
        }
      }
    } catch (error) {
      console.error("Generation failed:", error);
    }
  };

  const handlePayAndDownload = async () => {
    if (!certificateId) {
      toast.error("No certificate to purchase");
      return;
    }

    try {
      await initiateCertificatePayment(certificateId);
    } catch (error) {
      console.error("Payment failed:", error);
      toast.error("Payment initiation failed. Please try again.");
    }
  };

  const isAuthenticated = !!user;

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
                {isAdmin 
                  ? "Generate comprehensive work certificates for any promoter. Free as admin." 
                  : "Generate your verified work experience certificate. Payment required to download."}
              </CardDescription>
            </div>
            <Badge variant="outline" className="px-4 py-2 border-primary/30 bg-primary/5">
              <CheckCircle className="h-4 w-4 mr-2 text-primary" />
              {isAdmin ? "Admin — Free" : "Promoter — BHD 3.000"}
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

          {isPromoter && (
            <Alert className="mb-6 bg-blue-50 border-blue-200">
              <Lock className="h-4 w-4 text-blue-600" />
              <AlertTitle>Payment Required</AlertTitle>
              <AlertDescription>
                As a promoter, generating a certificate costs <strong>BHD 3.000</strong> per certificate. 
                You can preview the certificate for free. Payment is required only when you download the PDF.
                Admin-generated certificates are free.
              </AlertDescription>
            </Alert>
          )}

          <Tabs defaultValue="generate" className="w-full">
            <TabsList className="grid w-full grid-cols-3 mb-6">
              <TabsTrigger value="generate">Generate Certificate</TabsTrigger>
              <TabsTrigger value="customize">Customize Design</TabsTrigger>
              {(isAdmin || user?.role === 'company') && (
                <TabsTrigger value="settings">
                  {isAdmin ? 'Admin Settings' : 'Company Settings'}
                </TabsTrigger>
              )}
            </TabsList>

            <TabsContent value="generate" className="space-y-6">
              {/* Admin can select a user */}
              {isAdmin && (
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

              <div className="flex flex-col items-center gap-3">
                <Button 
                  onClick={handleGenerate}
                  disabled={loading || !user || (isAdmin && selectedUserId === "") || selectedShifts.length === 0}
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
                      {isAdmin ? "Generate Free Certificate" : "Generate Certificate Preview"}
                    </>
                  )}
                </Button>

                {isPromoter && (
                  <p className="text-sm text-muted-foreground">
                    Preview is free. Payment of <strong>BHD 3.000</strong> required to download PDF.
                  </p>
                )}
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

            {isAdmin && (
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
              {isAdmin 
                ? "Review the certificate before downloading (free)" 
                : "Review your certificate. Complete payment to download the PDF."}
            </CardDescription>
          </CardHeader>

          <CardContent className="p-6">
            <EnhancedCertificatePreview 
              certificateData={certificateData}
              template={certificateTemplate}
            />

            <div className="flex flex-wrap gap-3 justify-center mt-8">
              {isAdmin ? (
                /* Admin sees free download */
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
                  Download PDF (Free)
                </Button>
              ) : (
                /* Promoter sees pay to download */
                <>
                  <Button 
                    onClick={handlePayAndDownload}
                    disabled={loadingPayment || !certificateId}
                    size="lg"
                    className="px-6 bg-emerald-600 hover:bg-emerald-700"
                  >
                    {loadingPayment ? (
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
                    ) : (
                      <Lock className="h-4 w-4 mr-2" />
                    )}
                    Pay BHD 3.000 & Download
                  </Button>

                  <Button 
                    onClick={handleDownload}
                    disabled={downloading}
                    variant="outline"
                    size="lg"
                    className="px-6"
                  >
                    {downloading ? (
                      <div className="w-4 h-4 border-2 border-primary/30 border-t-primary rounded-full animate-spin mr-2" />
                    ) : (
                      <Download className="h-4 w-4 mr-2" />
                    )}
                    Test Download (Preview Only)
                  </Button>
                </>
              )}

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
