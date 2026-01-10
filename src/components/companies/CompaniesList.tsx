import { useState, useEffect } from "react";
import { useCompanies } from "./hooks/useCompanies";
import { CompanyStats } from "./CompanyStats";
import { CompanyDetail } from "./CompanyDetail";
import { CompanyTableSkeleton } from "./list/CompanyTableSkeleton";
import { CompanyFilters } from "./list/CompanyFilters";
import { CompanyTable } from "./list/CompanyTable";
import { toast } from "sonner";
import { AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { format } from "date-fns";
import { BulkRequestChangesDialog } from "@/components/admin/dialogs/BulkRequestChangesDialog";

interface CompaniesListProps {
  filterStatus?: string | null;
}

export function CompaniesList({ filterStatus }: CompaniesListProps) {
  const {
    companies,
    loading,
    error,
    searchTerm,
    setSearchTerm,
    sortBy,
    sortDirection,
    toggleSort
  } = useCompanies();
  const [selectedCompany, setSelectedCompany] = useState<string | null>(null);
  const [selectedStatus, setSelectedStatus] = useState<string | null>(filterStatus);
  const [selectedCompanies, setSelectedCompanies] = useState<string[]>([]);
  const [showBulkRequestDialog, setShowBulkRequestDialog] = useState(false);
  
  // Update selected status when filterStatus prop changes
  useEffect(() => {
    setSelectedStatus(filterStatus);
  }, [filterStatus]);
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [selectedStatus, searchTerm]);
  
  // Filter companies by verification status if selected
  const filteredByStatus = selectedStatus 
    ? companies.filter(c => c.verificationStatus === selectedStatus)
    : companies;
    
  // Calculate pagination
  const paginatedCompanies = filteredByStatus.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Close the detail panel
  const handleCloseDetail = () => {
    setSelectedCompany(null);
  };
  
  // Handle checkbox selection
  const handleSelectCompany = (companyId: string) => {
    setSelectedCompanies(prev => {
      if (prev.includes(companyId)) {
        return prev.filter(id => id !== companyId);
      } else {
        return [...prev, companyId];
      }
    });
  };
  
  // Handle select all checkbox
  const handleSelectAll = () => {
    if (selectedCompanies.length === paginatedCompanies.length) {
      setSelectedCompanies([]);
    } else {
      setSelectedCompanies(paginatedCompanies.map(c => c.id));
    }
  };
  
  // Bulk action handlers
  const handleBulkAction = async (action: string) => {
    if (selectedCompanies.length === 0) {
      toast.warning("Please select at least one company");
      return;
    }
    
    try {
      const { supabase } = await import("@/integrations/supabase/client");
      
      if (action === "approve") {
        const { error } = await supabase
          .from('profiles')
          .update({ verification_status: 'approved' })
          .in('id', selectedCompanies);
        
        if (error) throw error;
        toast.success(`Approved ${selectedCompanies.length} companies`);
        
      } else if (action === "reject") {
        const { error } = await supabase
          .from('profiles')
          .update({ verification_status: 'rejected' })
          .in('id', selectedCompanies);
        
        if (error) throw error;
        toast.error(`Rejected ${selectedCompanies.length} companies`);
      }
      
      setSelectedCompanies([]);
      window.location.reload(); // Refresh to show updated data
      
    } catch (error) {
      console.error('Bulk action error:', error);
      toast.error('Failed to update companies');
    }
  };
  
  // Status filter handler
  const handleStatusFilter = (status: string | null) => {
    setSelectedStatus(status);
    setCurrentPage(1); // Reset to first page when filtering
  };

  // Export data function
  const exportData = () => {
    return filteredByStatus.map(c => ({
      company_name: c.companyName || "",
      registration_id: c.registrationId || "",
      industry: c.industry || "",
      company_size: c.companySize || "",
      signup_date: c.signupDate ? format(new Date(c.signupDate), "yyyy-MM-dd") : "",
      verification_status: c.verificationStatus || "",
      total_shifts: c.totalShifts || 0,
      total_hours: (c.totalHours || 0).toFixed(2),
      total_spend: (c.totalSpend || 0).toFixed(2),
      promoters_count: c.promotersCount || 0,
      last_activity: c.lastActivityDate ? format(new Date(c.lastActivityDate), "yyyy-MM-dd") : "",
      email: c.email || "",
      phone: c.phoneNumber || "",
      website: c.website || "",
    }));
  };

  // Show error if there's an issue fetching data
  if (error) {
    return (
      <Alert variant="destructive" className="my-4">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          There was an error loading company data. Please try again later.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      <CompanyStats companies={companies} loading={loading} />
      
      <CompanyFilters 
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        selectedStatus={selectedStatus}
        handleStatusFilter={handleStatusFilter}
        selectedCompanies={selectedCompanies}
        handleBulkAction={handleBulkAction}
        exportData={exportData}
      />

      {loading ? (
        <CompanyTableSkeleton count={5} />
      ) : (
        <CompanyTable 
          paginatedCompanies={paginatedCompanies}
          filteredByStatus={filteredByStatus}
          itemsPerPage={itemsPerPage}
          currentPage={currentPage}
          setCurrentPage={setCurrentPage}
          toggleSort={toggleSort}
          sortBy={sortBy}
          sortDirection={sortDirection}
          setSelectedCompany={setSelectedCompany}
          selectedCompanies={selectedCompanies}
          handleSelectCompany={handleSelectCompany}
          handleSelectAll={handleSelectAll}
        />
      )}

      {selectedCompany && (
        <CompanyDetail 
          companyId={selectedCompany} 
          onClose={handleCloseDetail} 
          companyData={companies.find(c => c.id === selectedCompany)}
        />
      )}

      {/* Bulk Request Changes Dialog */}
      <BulkRequestChangesDialog
        open={showBulkRequestDialog}
        onOpenChange={(open) => {
          setShowBulkRequestDialog(open);
          if (!open) {
            setSelectedCompanies([]);
          }
        }}
        userIds={selectedCompanies}
        userRole="company"
        userCount={selectedCompanies.length}
      />
    </div>
  );
}
