
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { CheckCircle } from "lucide-react";
import useCertificateList from "./hooks/useCertificateList";
import CertificatesFilter from "./list/CertificatesFilter";
import CertificatesList from "./list/CertificatesList";
import EmptyCertificates from "./list/EmptyCertificates";
import AuthWarning from "./list/AuthWarning";

export default function MyCertificates() {
  const {
    filteredCertificates,
    loading,
    searchTerm,
    setSearchTerm,
    setFilterType,
    isAuthenticated,
    handleDownload,
    handleViewDetails,
    formatDateForDisplay
  } = useCertificateList();
  
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
        <CertificatesFilter 
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          onFilterChange={setFilterType}
        />
        
        {!isAuthenticated && <AuthWarning />}
        
        {filteredCertificates.length === 0 ? (
          <EmptyCertificates 
            searchTerm={searchTerm} 
            onClearSearch={() => setSearchTerm("")}
          />
        ) : (
          <CertificatesList
            certificates={filteredCertificates}
            isAuthenticated={isAuthenticated}
            handleDownload={handleDownload}
            handleViewDetails={handleViewDetails}
            formatDateForDisplay={formatDateForDisplay}
          />
        )}
      </CardContent>
    </Card>
  );
}
