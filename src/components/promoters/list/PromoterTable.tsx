
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
            {paginatedPromoters.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="h-24 text-center">
                  No promoters found.
                </TableCell>
              </TableRow>
            ) : (
              paginatedPromoters.map((promoter) => (
                <PromoterTableRow
                  key={promoter.id}
                  promoter={promoter}
                  setSelectedPromoter={setSelectedPromoter}
                  handleSelectPromoter={handleSelectPromoter}
                  selectedPromoters={selectedPromoters}
                />
              ))
            )}
          </TableBody>
        </Table>

        {/* Pagination */}
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
