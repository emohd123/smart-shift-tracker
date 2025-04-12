
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { PromoterData } from "../types";

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
  const getSortIndicator = (field: string) => {
    if (sortBy !== field) return null;
    return sortDirection === 'asc' ? '↑' : '↓';
  };

  return (
    <TableHeader>
      <TableRow>
        <TableHead className="w-[50px]">
          <Checkbox 
            checked={selectedPromoters.length === paginatedPromoters.length && paginatedPromoters.length > 0}
            onCheckedChange={handleSelectAll}
            aria-label="Select all"
          />
        </TableHead>
        <TableHead className="w-[250px]">
          <Button 
            variant="ghost" 
            onClick={() => toggleSort('full_name')}
            className="font-semibold"
          >
            Promoter {getSortIndicator('full_name')}
          </Button>
        </TableHead>
        <TableHead>
          <Button 
            variant="ghost" 
            onClick={() => toggleSort('nationality')}
            className="font-semibold"
          >
            Nationality {getSortIndicator('nationality')}
          </Button>
        </TableHead>
        <TableHead>
          <Button 
            variant="ghost" 
            onClick={() => toggleSort('verification_status')}
            className="font-semibold"
          >
            Status {getSortIndicator('verification_status')}
          </Button>
        </TableHead>
        <TableHead className="text-right">
          <Button 
            variant="ghost" 
            onClick={() => toggleSort('total_hours')}
            className="font-semibold"
          >
            Hours {getSortIndicator('total_hours')}
          </Button>
        </TableHead>
        <TableHead className="text-right">
          <Button 
            variant="ghost" 
            onClick={() => toggleSort('average_rating')}
            className="font-semibold"
          >
            Rating {getSortIndicator('average_rating')}
          </Button>
        </TableHead>
        <TableHead className="text-right">
          <Button 
            variant="ghost" 
            onClick={() => toggleSort('created_at')}
            className="font-semibold"
          >
            Joined {getSortIndicator('created_at')}
          </Button>
        </TableHead>
        <TableHead className="w-[100px]"></TableHead>
      </TableRow>
    </TableHeader>
  );
}
