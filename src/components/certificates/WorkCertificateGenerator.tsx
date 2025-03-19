
import { useState } from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";
import { Loader2, Download, Share2, MailIcon, QrCode, Clock, Users } from "lucide-react";
import { useCertificateGeneration } from "./hooks/useCertificateGeneration";
import CertificatePreview from "./CertificatePreview";
import { Collapse } from "@/components/ui/collapse";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Combobox } from "@/components/ui/combobox";

export type TimePeriod = "3months" | "6months" | "1year" | "all";

export default function WorkCertificateGenerator() {
  const { user } = useAuth();
  const [timePeriod, setTimePeriod] = useState<TimePeriod>("6months");
  const [showPreview, setShowPreview] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<string>("");
  const [promoters, setPromoters] = useState<any[]>([]);
  const [loadingPromoters, setLoadingPromoters] = useState(false);
  
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
  
  // Fetch promoters if user is admin
  useState(() => {
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
  });
  
  const handleGenerate = async () => {
    setShowPreview(false);
    
    try {
      await generateCertificate();
      setShowPreview(true);
      toast.success("Certificate generated successfully!");
    } catch (error) {
      console.error("Failed to generate certificate:", error);
      toast.error("Failed to generate certificate. Please try again.");
    }
  };

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle className="text-2xl font-bold">Work Certificate Generator</CardTitle>
        <CardDescription>
          Generate a professional certificate summarizing your completed work periods
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Admin can select a user */}
        {user?.role === 'admin' && (
          <div className="space-y-2">
            <Label htmlFor="userId">Generate Certificate For</Label>
            <RadioGroup 
              defaultValue="self" 
              onValueChange={(value) => {
                if (value === "self") {
                  setSelectedUserId(user.id);
                } else {
                  setSelectedUserId("");
                }
              }}
              className="flex space-x-4"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="self" id="self" />
                <Label htmlFor="self">Yourself</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="promoter" id="promoter" />
                <Label htmlFor="promoter">Promoter</Label>
              </div>
            </RadioGroup>
            
            {selectedUserId === "" && (
              <div className="pt-2">
                <Label htmlFor="promoterSelect">Select Promoter</Label>
                <Select 
                  disabled={loadingPromoters}
                  onValueChange={setSelectedUserId}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select a promoter" />
                  </SelectTrigger>
                  <SelectContent>
                    {loadingPromoters ? (
                      <div className="flex items-center justify-center py-2">
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        Loading...
                      </div>
                    ) : (
                      promoters.map(promoter => (
                        <SelectItem key={promoter.id} value={promoter.id}>
                          {promoter.full_name}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
        )}
        
        <div className="space-y-2">
          <Label htmlFor="timePeriod">Select Time Period</Label>
          <Select 
            value={timePeriod} 
            onValueChange={(value) => setTimePeriod(value as TimePeriod)}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select time period" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="3months">Last 3 Months</SelectItem>
              <SelectItem value="6months">Last 6 Months</SelectItem>
              <SelectItem value="1year">Last 1 Year</SelectItem>
              <SelectItem value="all">All Time</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <Button 
          className="w-full" 
          onClick={handleGenerate}
          disabled={loading || !user || (user.role === 'admin' && selectedUserId === "")}
        >
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Generating Certificate...
            </>
          ) : (
            <>
              <Clock className="mr-2 h-4 w-4" />
              Generate Certificate
            </>
          )}
        </Button>
        
        <Collapse open={showPreview && !!certificateData}>
          <div className="pt-4">
            <CertificatePreview certificateData={certificateData} />
          </div>
        </Collapse>
      </CardContent>
      
      {showPreview && certificateData && (
        <CardFooter className="flex flex-wrap gap-2 justify-center">
          <Button 
            variant="default" 
            onClick={handleDownload}
            disabled={downloading}
          >
            {downloading ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Download className="mr-2 h-4 w-4" />
            )}
            Download PDF
          </Button>
          
          <Button 
            variant="secondary" 
            onClick={handleShare}
            disabled={sharing}
          >
            <Share2 className="mr-2 h-4 w-4" />
            Share
          </Button>
          
          <Button 
            variant="outline" 
            onClick={handleEmail}
          >
            <MailIcon className="mr-2 h-4 w-4" />
            Email
          </Button>
          
          <Button 
            variant="ghost"
            onClick={() => window.open(`/verify-certificate/${certificateData.referenceNumber}`, '_blank')}
          >
            <QrCode className="mr-2 h-4 w-4" />
            View QR Code
          </Button>
        </CardFooter>
      )}
    </Card>
  );
}
