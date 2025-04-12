
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { PromoterData } from "../types";
import { ArrowDown, ArrowUp } from "lucide-react";

interface PromoterTableHeaderProps {
  toggleSort: (field: keyof PromoterData) => void;
  sortBy: keyof PromoterData;
  sortDirection: "asc" | "desc";
  handleSelectAll: () => void;
  selectedPromoters: string[];
  paginatedPromoters: PromoterData[];
}

export function PromoterTableHeader({ 
  toggleSort, 
  sortBy, 
  sortDirection, 
  handleSelectAll,
  selectedPromoters,
  paginatedPromoters
}: PromoterTableHeaderProps) {
  // Get sort indicator
  const getSortIndicator = (field: keyof PromoterData) => {
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
    field: keyof PromoterData, 
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
            checked={selectedPromoters.length === paginatedPromoters.length && paginatedPromoters.length > 0}
            onCheckedChange={handleSelectAll}
            aria-label="Select all"
          />
        </TableHead>
        <TableHead className="w-[250px]">
          <SortableHeader field="full_name" label="Promoter" />
        </TableHead>
        <TableHead>
          <SortableHeader field="nationality" label="Nationality" />
        </TableHead>
        <TableHead>
          <SortableHeader field="verification_status" label="Status" />
        </TableHead>
        <TableHead className="text-right">
          <SortableHeader field="total_hours" label="Hours" className="justify-end" />
        </TableHead>
        <TableHead className="text-right">
          <SortableHeader field="average_rating" label="Rating" className="justify-end" />
        </TableHead>
        <TableHead className="text-right">
          <SortableHeader field="created_at" label="Joined" className="justify-end" />
        </TableHead>
        <TableHead className="w-[100px] text-right">Actions</TableHead>
      </TableRow>
    </TableHeader>
  );
}
