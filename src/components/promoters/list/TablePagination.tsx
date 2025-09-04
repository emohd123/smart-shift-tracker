
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { Skeleton } from "@/components/ui/skeleton";

interface TablePaginationProps {
  currentPage: number;
  totalPages: number;
  setCurrentPage: (page: number) => void;
  totalItems?: number;
  loading?: boolean;
}

export function TablePagination({
  currentPage,
  totalPages,
  setCurrentPage,
  totalItems,
  loading = false,
}: TablePaginationProps) {
  const getPageNumbers = () => {
    const pages = [];
    const maxPagesToShow = 5;
    
    if (totalPages <= maxPagesToShow) {
      // Show all pages if total pages are less than or equal to max pages to show
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      // Always show first page
      pages.push(1);
      
      // Calculate start and end page numbers to show
      let startPage = Math.max(2, currentPage - 1);
      let endPage = Math.min(totalPages - 1, currentPage + 1);
      
      // Adjust if we're near the start
      if (currentPage <= 3) {
        endPage = Math.min(totalPages - 1, 4);
      }
      
      // Adjust if we're near the end
      if (currentPage >= totalPages - 2) {
        startPage = Math.max(2, totalPages - 3);
      }
      
      // Add ellipsis after first page if needed
      if (startPage > 2) {
        pages.push('ellipsis-start');
      }
      
      // Add middle pages
      for (let i = startPage; i <= endPage; i++) {
        pages.push(i);
      }
      
      // Add ellipsis before last page if needed
      if (endPage < totalPages - 1) {
        pages.push('ellipsis-end');
      }
      
      // Always show last page
      if (totalPages > 1) {
        pages.push(totalPages);
      }
    }
    
    return pages;
  };

  // Handle edge case when there are no items
  if (totalItems === 0 || totalPages === 0) {
    return null;
  }

  return (
    <div className="py-4 border-t flex flex-col md:flex-row justify-between items-center gap-2">
      {loading ? (
        <Skeleton className="h-6 w-48" />
      ) : (
        totalItems !== undefined && (
          <div className="text-sm text-muted-foreground">
            Showing {totalItems > 0 ? (currentPage - 1) * 10 + 1 : 0} to{" "}
            {Math.min(currentPage * 10, totalItems)} of {totalItems} promoters
          </div>
        )
      )}
      
      <Pagination>
        <PaginationContent>
          <PaginationItem>
            <PaginationPrevious
              onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
              className={
                currentPage === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"
              }
            />
          </PaginationItem>

          {getPageNumbers().map((page, index) => (
            <PaginationItem key={`page-${index}`}>
              {page === 'ellipsis-start' || page === 'ellipsis-end' ? (
                <span className="flex h-9 w-9 items-center justify-center">...</span>
              ) : (
                <PaginationLink
                  isActive={currentPage === page}
                  onClick={() => setCurrentPage(page as number)}
                  className="cursor-pointer"
                >
                  {page}
                </PaginationLink>
              )}
            </PaginationItem>
          ))}

          <PaginationItem>
            <PaginationNext
              onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
              className={
                currentPage === totalPages || totalPages === 0 ? "pointer-events-none opacity-50" : "cursor-pointer"
              }
            />
          </PaginationItem>
        </PaginationContent>
      </Pagination>
    </div>
  );
}
