
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/AuthContext";
import { Download, ExternalLink, Clock, Search, Calendar, Filter, CheckCircle } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { format, parseISO } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { motion } from "framer-motion";
import { toast } from "sonner";

type Certificate = {
  id: string;
  reference_number: string;
  issue_date: string;
  time_period: string;
  total_hours: number;
  pdf_url: string | null;
};

export default function MyCertificates() {
  const { user, isAuthenticated } = useAuth();
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState<string>("all");
  
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
              },
              {
                id: "3",
                reference_number: "CERT-GHI789",
                issue_date: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString(),
                time_period: "Last 1 Year",
                total_hours: 120,
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
    if (!isAuthenticated) {
      toast.error("Please login to download certificates");
      return;
    }
    
    if (cert.pdf_url) {
      window.open(cert.pdf_url, '_blank');
    } else {
      // For demo purposes, simulate download
      toast.success(`Downloading certificate ${cert.reference_number}...`);
    }
  };
  
  const handleViewDetails = (cert: Certificate) => {
    window.open(`/verify-certificate/${cert.reference_number}`, '_blank');
  };
  
  // Filter certificates by search term and filter type
  const filteredCertificates = certificates.filter(cert => {
    const matchesSearch = cert.reference_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          cert.time_period.toLowerCase().includes(searchTerm.toLowerCase());
    
    if (filterType === "all") return matchesSearch;
    if (filterType === "recent" && new Date(cert.issue_date) > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)) return matchesSearch;
    if (filterType === "3months" && cert.time_period.includes("3 Months")) return matchesSearch;
    if (filterType === "6months" && cert.time_period.includes("6 Months")) return matchesSearch;
    if (filterType === "1year" && cert.time_period.includes("1 Year")) return matchesSearch;
    
    return false;
  });
  
  const formatDateForDisplay = (dateString: string) => {
    try {
      return format(parseISO(dateString), "MMMM d, yyyy");
    } catch (error) {
      console.error("Invalid date format:", dateString);
      return dateString;
    }
  };
  
  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>My Certificates</CardTitle>
        </CardHeader>
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
      <CardHeader className="bg-secondary/20">
        <CardTitle className="flex items-center gap-2">
          <CheckCircle className="h-5 w-5 text-primary" />
          My Professional Certificates
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6">
        <div className="flex flex-col sm:flex-row items-center gap-2 mb-6">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search certificates..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 w-full"
            />
          </div>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="flex items-center gap-1 whitespace-nowrap">
                <Filter className="h-4 w-4" />
                Filter
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setFilterType("all")}>
                All Certificates
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setFilterType("recent")}>
                Recently Generated
              </DropdownMenuItem>
              <Separator className="my-1" />
              <DropdownMenuItem onClick={() => setFilterType("3months")}>
                3 Months Certificates
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setFilterType("6months")}>
                6 Months Certificates
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setFilterType("1year")}>
                1 Year Certificates
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        
        {!isAuthenticated && (
          <Alert variant="destructive" className="mb-4">
            <AlertDescription>
              You need to be logged in to view and download your certificates.
            </AlertDescription>
          </Alert>
        )}
        
        {filteredCertificates.length === 0 ? (
          <div className="text-center py-12 border rounded-lg bg-secondary/10">
            <Clock className="mx-auto h-12 w-12 text-muted-foreground/50" />
            <h3 className="mt-4 text-lg font-medium">No certificates found</h3>
            <p className="text-muted-foreground mt-2">
              {searchTerm ? "Try a different search term" : "Generate your first certificate to see it here"}
            </p>
            {searchTerm && (
              <Button 
                variant="outline" 
                size="sm" 
                className="mt-4"
                onClick={() => setSearchTerm("")}
              >
                Clear Search
              </Button>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {filteredCertificates.map((cert, index) => (
              <motion.div
                key={cert.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: index * 0.1 }}
                className="border rounded-lg p-4 hover:bg-secondary/30 transition-colors"
              >
                <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="font-medium">{cert.reference_number}</h3>
                      <Badge variant="outline">{cert.time_period}</Badge>
                    </div>
                    <div className="flex items-center gap-2 text-muted-foreground text-sm mt-1">
                      <Calendar className="h-3 w-3" />
                      Issued: {formatDateForDisplay(cert.issue_date)}
                    </div>
                    <p className="text-sm mt-2 flex items-center gap-1">
                      <Clock className="h-3 w-3 text-primary" />
                      <span className="font-medium">{cert.total_hours}</span> total hours
                    </p>
                  </div>
                  
                  <div className="flex flex-wrap gap-2 w-full sm:w-auto">
                    <Button 
                      variant="default" 
                      size="sm" 
                      onClick={() => handleDownload(cert)}
                      className="flex-1 sm:flex-none"
                      disabled={!isAuthenticated}
                    >
                      <Download className="mr-1 h-3 w-3" />
                      Download
                    </Button>
                    
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => handleViewDetails(cert)}
                      className="flex-1 sm:flex-none"
                    >
                      <ExternalLink className="mr-1 h-3 w-3" />
                      View Details
                    </Button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
