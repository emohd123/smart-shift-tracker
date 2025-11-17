
import { useState, useEffect } from "react";
import { usePromoters } from "../hooks/usePromoters";
import { PromoterStats } from "../PromoterStats";
import { PromoterDetail } from "../PromoterDetail";
import { PromoterTableSkeleton } from "./PromoterTableSkeleton";
import { PromoterFilters } from "./PromoterFilters";
import { PromoterTable } from "./PromoterTable";
import { toast } from "sonner";
import { AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface PromotersListProps {
  filterStatus?: string | null;
}

export function PromotersList({ filterStatus }: PromotersListProps) {
  const {
    promoters,
    loading,
    error,
    searchTerm,
    setSearchTerm,
    sortBy,
    sortDirection,
    toggleSort
  } = usePromoters();
  const [selectedPromoter, setSelectedPromoter] = useState<string | null>(null);
  const [selectedStatus, setSelectedStatus] = useState<string | null>(filterStatus);
  const [selectedPromoters, setSelectedPromoters] = useState<string[]>([]);
  
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
  
  // Filter promoters by verification status if selected
  const filteredByStatus = selectedStatus 
    ? promoters.filter(p => p.verification_status === selectedStatus)
    : promoters;
    
  // Calculate pagination
  const paginatedPromoters = filteredByStatus.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Close the detail panel
  const handleCloseDetail = () => {
    setSelectedPromoter(null);
  };
  
  // Handle checkbox selection
  const handleSelectPromoter = (promoterId: string) => {
    setSelectedPromoters(prev => {
      if (prev.includes(promoterId)) {
        return prev.filter(id => id !== promoterId);
      } else {
        return [...prev, promoterId];
      }
    });
  };
  
  // Handle select all checkbox
  const handleSelectAll = () => {
    if (selectedPromoters.length === paginatedPromoters.length) {
      setSelectedPromoters([]);
    } else {
      setSelectedPromoters(paginatedPromoters.map(p => p.id));
    }
  };
  
  // Bulk action handlers
  const handleBulkAction = async (action: string) => {
    if (selectedPromoters.length === 0) {
      toast.warning("Please select at least one promoter");
      return;
    }
    
    try {
      const { supabase } = await import("@/integrations/supabase/client");
      
      if (action === "approve") {
        const { error } = await supabase
          .from('profiles')
          .update({ verification_status: 'approved' })
          .in('id', selectedPromoters);
        
        if (error) throw error;
        toast.success(`Approved ${selectedPromoters.length} promoter${selectedPromoters.length > 1 ? 's' : ''}`);
        
      } else if (action === "reject") {
        const { error } = await supabase
          .from('profiles')
          .update({ verification_status: 'rejected' })
          .in('id', selectedPromoters);
        
        if (error) throw error;
        toast.error(`Rejected ${selectedPromoters.length} promoter${selectedPromoters.length > 1 ? 's' : ''}`);
      }
      
      // Clear selection after action
      setSelectedPromoters([]);
      
      // Force re-fetch to show updated data
      window.location.reload();
      
    } catch (error) {
      console.error('Bulk action error:', error);
      toast.error('Failed to update promoters. Please try again.');
    }
  };
  
  // Status filter handler
  const handleStatusFilter = (status: string | null) => {
    setSelectedStatus(status);
    setCurrentPage(1); // Reset to first page when filtering
  };

  // Show error if there's an issue fetching data
  if (error) {
    return (
      <Alert variant="destructive" className="my-4">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          There was an error loading promoter data. Please try again later.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      <PromoterStats promoters={promoters} loading={loading} />
      
      <PromoterFilters 
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        selectedStatus={selectedStatus}
        handleStatusFilter={handleStatusFilter}
        selectedPromoters={selectedPromoters}
        handleBulkAction={handleBulkAction}
      />

      {loading ? (
        <PromoterTableSkeleton count={5} />
      ) : (
        <PromoterTable 
          paginatedPromoters={paginatedPromoters}
          filteredByStatus={filteredByStatus}
          itemsPerPage={itemsPerPage}
          currentPage={currentPage}
          setCurrentPage={setCurrentPage}
          toggleSort={toggleSort}
          sortBy={sortBy}
          sortDirection={sortDirection}
          setSelectedPromoter={setSelectedPromoter}
          selectedPromoters={selectedPromoters}
          handleSelectPromoter={handleSelectPromoter}
          handleSelectAll={handleSelectAll}
        />
      )}

      {selectedPromoter && (
        <PromoterDetail 
          promoterId={selectedPromoter} 
          onClose={handleCloseDetail} 
          promoterData={promoters.find(p => p.id === selectedPromoter)}
        />
      )}
    </div>
  );
}
