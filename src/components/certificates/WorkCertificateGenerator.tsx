
import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";
import { CheckCircle, Shield } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Collapse } from "@/components/ui/collapse";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useCertificateGeneration } from "./hooks/useCertificateGeneration";
import CertificatePreview from "./CertificatePreview";
import AdminCertificateSelector from "./AdminCertificateSelector";
import TimePeriodSelector from "./generator/TimePeriodSelector";
import GenerateButton from "./generator/GenerateButton";
import CertificateActions from "./generator/CertificateActions";
import { TimePeriod } from "./types/certificate";

export default function WorkCertificateGenerator() {
  const { user, isAuthenticated } = useAuth();
  const [timePeriod, setTimePeriod] = useState<TimePeriod>("6months");
  const [showPreview, setShowPreview] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<string>("");
  const [promoters, setPromoters] = useState<any[]>([]);
  const [loadingPromoters, setLoadingPromoters] = useState(false);
  const [generateButtonClicked, setGenerateButtonClicked] = useState(false);
  
  const {
    generateCertificate,
    certificateData,
    loading,
    downloading,
    sharing,
    handleDownload,
    handleShare,
    handleEmail,
    fetchPromoters
  } = useCertificateGeneration(selectedUserId || user?.id || "", timePeriod);
  
  // Set initial user ID
  useEffect(() => {
    if (user) {
      setSelectedUserId(user.id);
    }
  }, [user]);
  
  // Fetch promoters if user is admin
  useEffect(() => {
    if (user?.role === 'admin') {
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
    setGenerateButtonClicked(true);
    
    if (!isAuthenticated) {
      toast.error("Please login to generate certificates");
      return;
    }
    
    setShowPreview(false);
    
    try {
      await generateCertificate();
      setShowPreview(true);
      toast.success("Certificate generated successfully!");
    } catch (error) {
      console.error("Failed to generate certificate:", error);
      toast.error("Failed to generate certificate. Please try again.");
    } finally {
      setGenerateButtonClicked(false);
    }
  };

  return (
    <Card className="w-full max-w-4xl mx-auto border border-primary/20">
      <CardHeader className="bg-secondary/30">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-2xl font-bold flex items-center gap-2">
              <Shield className="h-5 w-5 text-primary" />
              Work Certificate Generator
            </CardTitle>
            <CardDescription className="mt-1">
              Generate a professional certificate validated with a unique QR code and digital signature
            </CardDescription>
          </div>
          <Badge variant="outline" className="px-3 py-1 border-primary/30 bg-primary/5">
            <CheckCircle className="h-3.5 w-3.5 mr-1 text-primary" />
            Official Document
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-6 pt-6">
        {!isAuthenticated && generateButtonClicked && (
          <Alert variant="destructive" className="mb-4">
            <AlertTitle>Authentication Required</AlertTitle>
            <AlertDescription>
              You need to be logged in to generate and download certificates.
            </AlertDescription>
          </Alert>
        )}
        
        {/* Admin can select a user */}
        {user?.role === 'admin' && (
          <AdminCertificateSelector
            selectedUserId={selectedUserId}
            setSelectedUserId={setSelectedUserId}
            promoters={promoters}
            loadingPromoters={loadingPromoters}
          />
        )}
        
        <TimePeriodSelector timePeriod={timePeriod} setTimePeriod={setTimePeriod} />
        
        <GenerateButton 
          onClick={handleGenerate}
          loading={loading}
          disabled={!user || (user.role === 'admin' && selectedUserId === "")}
        />
        
        <Collapse open={showPreview && !!certificateData}>
          <div className="pt-4">
            <CertificatePreview certificateData={certificateData} />
          </div>
        </Collapse>
      </CardContent>
      
      {showPreview && certificateData && (
        <CardFooter className="flex flex-wrap gap-2 justify-center bg-secondary/20 p-6 rounded-b-lg">
          <CertificateActions
            certificateData={certificateData}
            downloading={downloading}
            sharing={sharing}
            isAuthenticated={isAuthenticated}
            handleDownload={handleDownload}
            handleShare={handleShare}
            handleEmail={handleEmail}
          />
        </CardFooter>
      )}
    </Card>
  );
}
