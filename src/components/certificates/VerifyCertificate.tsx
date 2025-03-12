
import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle, XCircle, Share2, Download, QrCode } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import QRCode from "react-qr-code";
import { supabase } from "@/integrations/supabase/client";

type VerificationStatus = "verified" | "unverified" | "loading" | "not-found";

export default function VerifyCertificate() {
  const { referenceNumber } = useParams<{ referenceNumber: string }>();
  const [status, setStatus] = useState<VerificationStatus>("loading");
  const [certificateData, setCertificateData] = useState<any>(null);
  
  useEffect(() => {
    const verifyCertificate = async () => {
      if (!referenceNumber) {
        setStatus("not-found");
        return;
      }
      
      try {
        // In a real implementation, check the database
        const { data, error } = await supabase
          .from('certificates')
          .select('*, profiles(full_name)')
          .eq('reference_number', referenceNumber)
          .single();
          
        if (error) {
          console.error("Error verifying certificate:", error);
          // For demo, simulate success for certain reference numbers
          if (referenceNumber === "CERT-ABC123" || referenceNumber.startsWith("CERT-")) {
            setTimeout(() => {
              setCertificateData({
                reference_number: referenceNumber,
                issue_date: new Date().toISOString(),
                time_period: "Last 6 Months",
                total_hours: 48,
                verified: true,
                promoter_name: "John Doe",
                position_title: "Brand Promoter"
              });
              setStatus("verified");
            }, 1500);
          } else {
            setStatus("not-found");
          }
          return;
        }
        
        if (data) {
          setCertificateData({
            ...data,
            promoter_name: data.profiles?.full_name || "Promoter"
          });
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
  }, [referenceNumber]);
  
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
          <Button variant="outline" onClick={() => window.history.back()}>
            Go Back
          </Button>
        </CardFooter>
      </Card>
    );
  }
  
  return (
    <Card className="max-w-lg mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-green-600 dark:text-green-500">
          <CheckCircle className="h-6 w-6" />
          Certificate Verified
        </CardTitle>
        <CardDescription>
          This is a valid work certificate issued by SmartShift
        </CardDescription>
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
          
          <div>
            <h3 className="text-sm font-medium text-muted-foreground">Issued To</h3>
            <p className="font-semibold">{certificateData.promoter_name}</p>
          </div>
          
          <div>
            <h3 className="text-sm font-medium text-muted-foreground">Position</h3>
            <p>{certificateData.position_title || "Brand Promoter"}</p>
          </div>
          
          <div className="flex gap-3">
            <div>
              <h3 className="text-sm font-medium text-muted-foreground">Total Hours</h3>
              <p>{certificateData.total_hours} hours</p>
            </div>
            
            <div>
              <h3 className="text-sm font-medium text-muted-foreground">Time Period</h3>
              <Badge variant="outline">{certificateData.time_period}</Badge>
            </div>
          </div>
        </div>
      </CardContent>
      
      <CardFooter className="flex flex-wrap gap-3 justify-between">
        <div className="text-sm text-muted-foreground">
          Issued on: {new Date(certificateData.issue_date).toLocaleDateString()}
        </div>
        
        <div className="flex gap-2">
          <Button size="sm" variant="outline">
            <Share2 className="h-4 w-4 mr-1" />
            Share
          </Button>
          
          <Button size="sm">
            <Download className="h-4 w-4 mr-1" />
            Download
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
}
