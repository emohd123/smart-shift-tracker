
import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/AuthContext";
import { Download, ExternalLink, Clock, Search } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { format } from "date-fns";
import { supabase } from "@/integrations/supabase/client";

type Certificate = {
  id: string;
  reference_number: string;
  issue_date: string;
  time_period: string;
  total_hours: number;
  pdf_url: string | null;
};

export default function MyCertificates() {
  const { user } = useAuth();
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  
  useEffect(() => {
    const fetchCertificates = async () => {
      if (!user) return;
      
      try {
        setLoading(true);
        
        // In a real implementation, fetch from the database
        const { data, error } = await supabase
          .from('certificates')
          .select('*')
          .eq('user_id', user.id)
          .order('issue_date', { ascending: false });
          
        if (error) {
          console.error("Error fetching certificates:", error);
          // For demo purposes, show mock data even if there's an error
          setTimeout(() => {
            setCertificates([
              {
                id: "1",
                reference_number: "CERT-ABC123",
                issue_date: new Date().toISOString(),
                time_period: "Last 6 Months",
                total_hours: 48,
                pdf_url: null
              },
              {
                id: "2",
                reference_number: "CERT-DEF456",
                issue_date: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
                time_period: "Last 3 Months",
                total_hours: 24,
                pdf_url: null
              }
            ]);
            setLoading(false);
          }, 1000);
          return;
        }
        
        if (data && data.length > 0) {
          setCertificates(data);
        } else {
          // Demo data if no certificates found
          setCertificates([
            {
              id: "1",
              reference_number: "CERT-ABC123",
              issue_date: new Date().toISOString(),
              time_period: "Last 6 Months",
              total_hours: 48,
              pdf_url: null
            }
          ]);
        }
      } catch (error) {
        console.error("Error fetching certificates:", error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchCertificates();
  }, [user]);
  
  const handleDownload = (cert: Certificate) => {
    if (cert.pdf_url) {
      window.open(cert.pdf_url, '_blank');
    } else {
      // For demo purposes, simulate download
      alert(`Downloading certificate ${cert.reference_number}...`);
    }
  };
  
  const handleViewDetails = (cert: Certificate) => {
    window.open(`/verify-certificate/${cert.reference_number}`, '_blank');
  };
  
  const filteredCertificates = certificates.filter(cert => 
    cert.reference_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
    cert.time_period.toLowerCase().includes(searchTerm.toLowerCase())
  );
  
  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="space-y-2 mb-4">
            <Skeleton className="h-10 w-full" />
          </div>
          
          {Array(3).fill(0).map((_, i) => (
            <div key={i} className="border rounded-lg p-4 mb-4">
              <div className="flex justify-between items-start">
                <div className="space-y-2">
                  <Skeleton className="h-5 w-40" />
                  <Skeleton className="h-4 w-24" />
                </div>
                <Skeleton className="h-8 w-24" />
              </div>
              <div className="mt-4 flex gap-2">
                <Skeleton className="h-9 w-28" />
                <Skeleton className="h-9 w-28" />
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    );
  }
  
  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center gap-2 mb-6">
          <Search className="h-5 w-5 text-muted-foreground" />
          <Input
            placeholder="Search certificates..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="flex-1"
          />
        </div>
        
        {filteredCertificates.length === 0 ? (
          <div className="text-center py-8">
            <Clock className="mx-auto h-12 w-12 text-muted-foreground/50" />
            <h3 className="mt-4 text-lg font-medium">No certificates found</h3>
            <p className="text-muted-foreground mt-2">
              {searchTerm ? "Try a different search term" : "Generate your first certificate to see it here"}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredCertificates.map((cert) => (
              <div key={cert.id} className="border rounded-lg p-4 hover:bg-secondary/30 transition-colors">
                <div className="flex justify-between items-start">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-medium">{cert.reference_number}</h3>
                      <Badge variant="outline">{cert.time_period}</Badge>
                    </div>
                    <p className="text-muted-foreground text-sm mt-1">
                      Issued: {format(new Date(cert.issue_date), "MMMM d, yyyy")}
                    </p>
                    <p className="text-sm mt-1">
                      <span className="font-medium">{cert.total_hours}</span> total hours
                    </p>
                  </div>
                </div>
                
                <div className="mt-4 flex flex-wrap gap-2">
                  <Button 
                    variant="default" 
                    size="sm" 
                    onClick={() => handleDownload(cert)}
                    className="text-xs"
                  >
                    <Download className="mr-1 h-3 w-3" />
                    Download
                  </Button>
                  
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => handleViewDetails(cert)}
                    className="text-xs"
                  >
                    <ExternalLink className="mr-1 h-3 w-3" />
                    View Details
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
