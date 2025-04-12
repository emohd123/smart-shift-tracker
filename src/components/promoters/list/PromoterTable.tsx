
import {
  Table,
  TableBody,
  TableCell,
  TableRow,
} from "@/components/ui/table";
import { PromoterTableHeader } from "./PromoterTableHeader";
import { PromoterTableRow } from "./PromoterTableRow";
import { TablePagination } from "./TablePagination";
import { PromoterData } from "../types";
import { Card } from "@/components/ui/card";
import { UsersIcon } from "lucide-react";

interface PromoterTableProps {
  paginatedPromoters: PromoterData[];
  filteredByStatus: PromoterData[];
  itemsPerPage: number;
  currentPage: number;
  setCurrentPage: (page: number) => void;
  toggleSort: (field: keyof PromoterData) => void;
  sortBy: keyof PromoterData;
  sortDirection: "asc" | "desc";
  setSelectedPromoter: (id: string) => void;
  selectedPromoters: string[];
  handleSelectPromoter: (id: string) => void;
  handleSelectAll: () => void;
}

export function PromoterTable({
  paginatedPromoters,
  filteredByStatus,
  itemsPerPage,
  currentPage,
  setCurrentPage,
  toggleSort,
  sortBy,
  sortDirection,
  setSelectedPromoter,
  selectedPromoters,
  handleSelectPromoter,
  handleSelectAll,
}: PromoterTableProps) {
  const totalPages = Math.ceil(filteredByStatus.length / itemsPerPage);

  // Handle the empty state with a more user-friendly message
  const renderEmptyState = () => {
    return (
      <TableRow>
        <TableCell colSpan={8} className="h-60 text-center">
          <div className="flex flex-col items-center justify-center p-6">
            <UsersIcon className="h-12 w-12 text-muted-foreground/40 mb-4" />
            <h3 className="text-lg font-medium">No promoters found</h3>
            <p className="text-muted-foreground mt-1 max-w-sm">
              {filteredByStatus.length === 0 
                ? "There are no promoters matching your filters. Try changing your search criteria or add new promoters."
                : "No promoters match your current search criteria. Try adjusting your filters."}
            </p>
          </div>
        </TableCell>
      </TableRow>
    );
  };

  return (
    <Card className="overflow-hidden">
      <div className="rounded-md border-0 bg-card">
        <Table>
          <PromoterTableHeader
            toggleSort={toggleSort}
            sortBy={sortBy}
            sortDirection={sortDirection}
            handleSelectAll={handleSelectAll}
            selectedPromoters={selectedPromoters}
            paginatedPromoters={paginatedPromoters}
          />
          <TableBody>
            {paginatedPromoters.length === 0 
              ? renderEmptyState()
              : paginatedPromoters.map((promoter) => (
                  <PromoterTableRow
                    key={promoter.id}
                    promoter={promoter}
                    setSelectedPromoter={setSelectedPromoter}
                    handleSelectPromoter={handleSelectPromoter}
                    selectedPromoters={selectedPromoters}
                  />
                ))
            }
          </TableBody>
        </Table>

        {/* Pagination - only show if we have results */}
        {filteredByStatus.length > 0 && (
          <TablePagination
            currentPage={currentPage}
            totalPages={totalPages}
            setCurrentPage={setCurrentPage}
            totalItems={filteredByStatus.length}
          />
        )}
      </div>
    </Card>
  );
}
