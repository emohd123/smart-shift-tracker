import {
  Table,
  TableBody,
  TableCell,
  TableRow,
} from "@/components/ui/table";
import { CompanyTableHeader } from "./CompanyTableHeader";
import { CompanyTableRow } from "./CompanyTableRow";
import { CompanyData } from "../types";
import { Card } from "@/components/ui/card";
import { Building2 } from "lucide-react";
import { TablePagination } from "@/components/promoters/list/TablePagination";

interface CompanyTableProps {
  paginatedCompanies: CompanyData[];
  filteredByStatus: CompanyData[];
  itemsPerPage: number;
  currentPage: number;
  setCurrentPage: (page: number) => void;
  toggleSort: (field: keyof CompanyData) => void;
  sortBy: keyof CompanyData;
  sortDirection: "asc" | "desc";
  setSelectedCompany: (id: string) => void;
  selectedCompanies: string[];
  handleSelectCompany: (id: string) => void;
  handleSelectAll: () => void;
}

export function CompanyTable({
  paginatedCompanies,
  filteredByStatus,
  itemsPerPage,
  currentPage,
  setCurrentPage,
  toggleSort,
  sortBy,
  sortDirection,
  setSelectedCompany,
  selectedCompanies,
  handleSelectCompany,
  handleSelectAll,
}: CompanyTableProps) {
  const totalPages = Math.ceil(filteredByStatus.length / itemsPerPage);

  // Handle the empty state with a more user-friendly message
  const renderEmptyState = () => {
    return (
      <TableRow>
        <TableCell colSpan={13} className="h-60 text-center">
          <div className="flex flex-col items-center justify-center p-6">
            <Building2 className="h-12 w-12 text-muted-foreground/40 mb-4" />
            <h3 className="text-lg font-medium">No companies found</h3>
            <p className="text-muted-foreground mt-1 max-w-sm">
              {filteredByStatus.length === 0 
                ? "There are no companies matching your filters. Try changing your search criteria."
                : "No companies match your current search criteria. Try adjusting your filters."}
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
          <CompanyTableHeader
            toggleSort={toggleSort}
            sortBy={sortBy}
            sortDirection={sortDirection}
            handleSelectAll={handleSelectAll}
            selectedCompanies={selectedCompanies}
            paginatedCompanies={paginatedCompanies}
          />
          <TableBody>
            {paginatedCompanies.length === 0 
              ? renderEmptyState()
              : paginatedCompanies.map((company) => (
                  <CompanyTableRow
                    key={company.id}
                    company={company}
                    setSelectedCompany={setSelectedCompany}
                    handleSelectCompany={handleSelectCompany}
                    selectedCompanies={selectedCompanies}
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
