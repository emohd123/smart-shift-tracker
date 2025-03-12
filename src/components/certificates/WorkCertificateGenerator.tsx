
import { useState } from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";
import { Loader2, Download, Share2, MailIcon, QrCode, Clock } from "lucide-react";
import { useCertificateGeneration } from "./hooks/useCertificateGeneration";
import CertificatePreview from "./CertificatePreview";
import { Collapse } from "@/components/ui/collapse";

export type TimePeriod = "3months" | "6months" | "1year" | "all";

export default function WorkCertificateGenerator() {
  const { user } = useAuth();
  const [timePeriod, setTimePeriod] = useState<TimePeriod>("6months");
  const [showPreview, setShowPreview] = useState(false);
  
  const {
    generateCertificate,
    certificateData,
    loading,
    downloading,
    sharing,
    handleDownload,
    handleShare,
    handleEmail
  } = useCertificateGeneration(user?.id || "", timePeriod);
  
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
          disabled={loading || !user}
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
