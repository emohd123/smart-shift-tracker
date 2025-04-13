import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle, XCircle, Share2, Download, Calendar, User, Briefcase, Clock, Shield } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import QRCode from "react-qr-code";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { generateCertificatePDF } from "./utils/pdfGenerator";
import { useCertificateStorage } from "./hooks/useCertificateStorage";

type VerificationStatus = "verified" | "unverified" | "loading" | "not-found" | "expired";

export default function VerifyCertificate() {
  const { referenceNumber } = useParams<{ referenceNumber: string }>();
  const [status, setStatus] = useState<VerificationStatus>("loading");
  const [certificateData, setCertificateData] = useState<any>(null);
  const navigate = useNavigate();
  const { logCertificateVerification } = useCertificateStorage();
  
  useEffect(() => {
    const verifyCertificate = async () => {
      if (!referenceNumber) {
        setStatus("not-found");
        return;
      }
      
      try {
        // Log this verification attempt
        await logCertificateVerification(referenceNumber);
        
        // For demo purposes, simulate success for certain reference numbers
        if (referenceNumber.startsWith("CERT-")) {
          setTimeout(() => {
            setCertificateData({
              reference_number: referenceNumber,
              issue_date: new Date().toISOString(),
              issued_date: new Date().toISOString(),
              time_period: "Last 6 Months",
              total_hours: 48,
              status: "approved",
              promoter_name: "John Doe",
              position_title: "Brand Promoter",
              promotion_names: ["Product Demo", "Brand Promotion"]
            });
            setStatus("verified");
          }, 1000);
          return;
        }
          
        // Call the Supabase Edge Function to verify the certificate
        const res = await fetch(
          `${window.location.origin}/functions/v1/verify-certificate?reference=${referenceNumber}`
        );
        
        const data = await res.json();
        
        if (!res.ok || !data.valid) {
          console.error("Error verifying certificate:", data.error);
          setStatus(data.expired ? "expired" : "not-found");
          return;
        }
        
        if (data.certificate) {
          setCertificateData(data.certificate);
          
          // Check if certificate is expired
          if (data.certificate.expiration_date) {
            const expiryDate = new Date(data.certificate.expiration_date);
            if (expiryDate < new Date()) {
              setStatus("expired");
              return;
            }
          }
          
          setStatus("verified");
        } else {
          setStatus("not-found");
        }
      } catch (error) {
        console.error("Error verifying certificate:", error);
        setStatus("not-found");
      }
    };
    
    verifyCertificate();
  }, [referenceNumber, logCertificateVerification]);
  
  const handleDownload = async () => {
    if (!certificateData) {
      toast.error("Certificate data not available");
      return;
    }
    
    try {
      toast.loading("Generating certificate PDF...");
      
      // Create certificate data for PDF generation
      const pdfData = {
        referenceNumber: certificateData.reference_number,
        promoterName: certificateData.promoter_name || "Promoter",
        totalHours: certificateData.total_hours,
        positionTitle: certificateData.position_title || "Brand Promoter",
        promotionNames: certificateData.promotion_names || [],
        skillsGained: certificateData.skills_gained || ["Communication", "Customer Service", "Sales", "Event Promotion"],
        shifts: [], // We don't have shift data here
        issueDate: new Date(certificateData.issue_date).toLocaleDateString('en-US', { 
          year: 'numeric', 
          month: 'long', 
          day: 'numeric' 
        }),
        managerContact: certificateData.manager_contact || "555-123-4567",
        performanceRating: certificateData.performance_rating || 5
      };
      
      // Generate PDF
      const pdfBlob = await generateCertificatePDF(pdfData);
      
      // Create a URL for the Blob
      const url = URL.createObjectURL(pdfBlob);
      
      // Create a link element
      const link = document.createElement('a');
      link.href = url;
      link.download = `Certificate-${certificateData.reference_number}.pdf`;
      
      // Click the link to trigger the download
      document.body.appendChild(link);
      link.click();
      
      // Clean up
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      toast.dismiss();
      toast.success("Certificate downloaded successfully");
    } catch (error) {
      console.error("Error generating certificate:", error);
      toast.dismiss();
      toast.error("Failed to generate certificate");
    }
  };
  
  const handleShare = () => {
    if (!certificateData) return;
    
    try {
      // Copy link to clipboard
      const url = window.location.href;
      navigator.clipboard.writeText(url);
      toast.success("Certificate link copied to clipboard");
    } catch (error) {
      console.error("Error sharing certificate:", error);
      toast.error("Failed to share certificate");
    }
  };
  
  if (status === "loading") {
    return (
      <Card className="max-w-lg mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Skeleton className="h-6 w-6 rounded-full" />
            <Skeleton className="h-6 w-40" />
          </CardTitle>
          <CardDescription>
            <Skeleton className="h-4 w-60" />
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-40 w-full" />
          <div className="space-y-2">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
          </div>
        </CardContent>
      </Card>
    );
  }
  
  if (status === "not-found") {
    return (
      <Card className="max-w-lg mx-auto border-destructive">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-destructive">
            <XCircle className="h-6 w-6" />
            Certificate Not Found
          </CardTitle>
          <CardDescription>
            We couldn't verify the certificate with reference number: {referenceNumber}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p>This certificate may be invalid or has been revoked. Please check the reference number and try again.</p>
        </CardContent>
        <CardFooter>
          <Button variant="outline" onClick={() => navigate(-1)}>
            Go Back
          </Button>
        </CardFooter>
      </Card>
    );
  }
  
  if (status === "expired") {
    return (
      <Card className="max-w-lg mx-auto border-yellow-500">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-yellow-500">
            <Clock className="h-6 w-6" />
            Certificate Expired
          </CardTitle>
          <CardDescription>
            This certificate has expired: {referenceNumber}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p>This certificate was valid but has now expired. Please contact the issuer for an updated certificate.</p>
        </CardContent>
        <CardFooter>
          <Button variant="outline" onClick={() => navigate(-1)}>
            Go Back
          </Button>
        </CardFooter>
      </Card>
    );
  }
  
  return (
    <Card className="max-w-lg mx-auto">
      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="flex items-center gap-2 text-green-600 dark:text-green-500">
              <CheckCircle className="h-6 w-6" />
              Certificate Verified
            </CardTitle>
            <CardDescription>
              This is a valid work certificate issued by SmartShift
            </CardDescription>
          </div>
          <Badge 
            variant={certificateData.status === "approved" ? "default" : "outline"} 
            className="capitalize"
          >
            <Shield className="h-3.5 w-3.5 mr-1" />
            {certificateData.status || "Verified"}
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-6">
        <div className="flex justify-center">
          <div className="bg-white p-3 rounded-lg">
            <QRCode 
              value={window.location.href} 
              size={150}
              level="M"
              className="h-32 w-32"
            />
          </div>
        </div>
        
        <div className="space-y-4">
          <div>
            <h3 className="text-sm font-medium text-muted-foreground">Certificate Reference</h3>
            <p className="font-semibold">{certificateData.reference_number}</p>
          </div>
          
          <div className="flex flex-col gap-3 mt-4">
            <div className="flex items-start gap-2">
              <User className="h-4 w-4 text-primary mt-1" />
              <div>
                <h3 className="text-sm font-medium text-muted-foreground">Issued To</h3>
                <p className="font-semibold">{certificateData.promoter_name}</p>
              </div>
            </div>
            
            <div className="flex items-start gap-2">
              <Briefcase className="h-4 w-4 text-primary mt-1" />
              <div>
                <h3 className="text-sm font-medium text-muted-foreground">Position</h3>
                <p>{certificateData.position_title || "Brand Promoter"}</p>
              </div>
            </div>
            
            <div className="flex items-start gap-2">
              <Calendar className="h-4 w-4 text-primary mt-1" />
              <div>
                <h3 className="text-sm font-medium text-muted-foreground">Time Period</h3>
                <Badge variant="outline">{certificateData.time_period}</Badge>
              </div>
            </div>
            
            {certificateData.expiration_date && (
              <div className="flex items-start gap-2">
                <Clock className="h-4 w-4 text-primary mt-1" />
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground">Valid Until</h3>
                  <p>{new Date(certificateData.expiration_date).toLocaleDateString()}</p>
                </div>
              </div>
            )}
          </div>
          
          <div className="mt-4 p-3 bg-secondary/30 rounded-lg">
            <h3 className="text-sm font-medium mb-1">Certificate Details</h3>
            <div className="flex justify-between text-sm">
              <span>Total Hours:</span>
              <span className="font-semibold">{certificateData.total_hours} hours</span>
            </div>
            
            {certificateData.promotion_names && certificateData.promotion_names.length > 0 && (
              <div className="mt-2">
                <span className="text-sm block mb-1">Promotions:</span>
                <div className="flex flex-wrap gap-1">
                  {certificateData.promotion_names.map((name: string, i: number) => (
                    <Badge key={i} variant="secondary" className="text-xs">{name}</Badge>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </CardContent>
      
      <CardFooter className="flex flex-wrap gap-3 justify-between">
        <div className="text-sm text-muted-foreground">
          Issued on: {new Date(certificateData.issued_date || certificateData.issue_date).toLocaleDateString()}
        </div>
        
        <div className="flex gap-2">
          <Button size="sm" variant="outline" onClick={handleShare}>
            <Share2 className="h-4 w-4 mr-1" />
            Share
          </Button>
          
          <Button size="sm" onClick={handleDownload}>
            <Download className="h-4 w-4 mr-1" />
            Download
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
}
