
import { useState } from "react";
import { usePromoters } from "../hooks/usePromoters";
import { PromoterStats } from "../PromoterStats";
import { PromoterDetail } from "../PromoterDetail";
import { PromoterTableSkeleton } from "./PromoterTableSkeleton";
import { PromoterFilters } from "./PromoterFilters";
import { PromoterTable } from "./PromoterTable";
import { toast } from "sonner";

export function PromotersList() {
  const {
    promoters,
    loading,
    searchTerm,
    setSearchTerm,
    sortBy,
    sortDirection,
    toggleSort
  } = usePromoters();
  const [selectedPromoter, setSelectedPromoter] = useState<string | null>(null);
  const [selectedStatus, setSelectedStatus] = useState<string | null>(null);
  const [selectedPromoters, setSelectedPromoters] = useState<string[]>([]);
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  
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
  const handleBulkAction = (action: string) => {
    if (selectedPromoters.length === 0) {
      toast.warning("Please select at least one promoter");
      return;
    }
    
    // In a real app, you would make API calls here
    if (action === "approve") {
      toast.success(`Approved ${selectedPromoters.length} promoters`);
    } else if (action === "reject") {
      toast.error(`Rejected ${selectedPromoters.length} promoters`);
    }
    
    // Clear selection after action
    setSelectedPromoters([]);
  };
  
  // Status filter handler
  const handleStatusFilter = (status: string | null) => {
    setSelectedStatus(status);
    setCurrentPage(1); // Reset to first page when filtering
  };

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
