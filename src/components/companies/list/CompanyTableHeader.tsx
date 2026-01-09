import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { CompanyData } from "../types";
import { ArrowDown, ArrowUp } from "lucide-react";

interface CompanyTableHeaderProps {
  toggleSort: (field: keyof CompanyData) => void;
  sortBy: keyof CompanyData;
  sortDirection: "asc" | "desc";
  handleSelectAll: () => void;
  selectedCompanies: string[];
  paginatedCompanies: CompanyData[];
}

export function CompanyTableHeader({ 
  toggleSort, 
  sortBy, 
  sortDirection, 
  handleSelectAll,
  selectedCompanies,
  paginatedCompanies
}: CompanyTableHeaderProps) {
  // Get sort indicator
  const getSortIndicator = (field: keyof CompanyData) => {
    if (sortBy !== field) return null;
    return sortDirection === 'asc' 
      ? <ArrowUp className="h-3 w-3 ml-1 inline" /> 
      : <ArrowDown className="h-3 w-3 ml-1 inline" />;
  };

  // Create a sortable header
  const SortableHeader = ({ 
    field, 
    label, 
    className = "" 
  }: { 
    field: keyof CompanyData, 
    label: string, 
    className?: string 
  }) => (
    <Button 
      variant="ghost" 
      onClick={() => toggleSort(field)}
      className={`font-semibold text-sm h-auto px-2 py-1 ${className}`}
    >
      <span>{label}</span>
      {getSortIndicator(field)}
    </Button>
  );

  return (
    <TableHeader className="bg-muted/50">
      <TableRow>
        <TableHead className="w-[50px]">
          <Checkbox 
            checked={selectedCompanies.length === paginatedCompanies.length && paginatedCompanies.length > 0}
            onCheckedChange={handleSelectAll}
            aria-label="Select all"
          />
        </TableHead>
        <TableHead className="w-[200px]">
          <SortableHeader field="companyName" label="Company Name" />
        </TableHead>
        <TableHead>
          <SortableHeader field="registrationId" label="Registration ID" />
        </TableHead>
        <TableHead>
          <SortableHeader field="industry" label="Industry" />
        </TableHead>
        <TableHead>
          <SortableHeader field="companySize" label="Size" />
        </TableHead>
        <TableHead>
          <SortableHeader field="verificationStatus" label="Status" />
        </TableHead>
        <TableHead className="text-right">
          <SortableHeader field="totalShifts" label="Shifts" className="justify-end" />
        </TableHead>
        <TableHead className="text-right">
          <SortableHeader field="totalHours" label="Hours" className="justify-end" />
        </TableHead>
        <TableHead className="text-right">
          <SortableHeader field="totalSpend" label="Spend" className="justify-end" />
        </TableHead>
        <TableHead className="text-right">
          <SortableHeader field="promotersCount" label="Promoters" className="justify-end" />
        </TableHead>
        <TableHead>
          <SortableHeader field="signupDate" label="Joined" />
        </TableHead>
        <TableHead>
          <SortableHeader field="lastActivityDate" label="Last Activity" />
        </TableHead>
        <TableHead className="w-[100px] text-right">Actions</TableHead>
      </TableRow>
    </TableHeader>
  );
}
