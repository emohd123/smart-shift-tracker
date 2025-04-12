
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { CheckCheck, Filter, Search, UserX } from "lucide-react";
import { toast } from "sonner";

interface PromoterFiltersProps {
  searchTerm: string;
  setSearchTerm: (value: string) => void;
  selectedStatus: string | null;
  handleStatusFilter: (status: string | null) => void;
  selectedPromoters: string[];
  handleBulkAction: (action: string) => void;
}

export function PromoterFilters({
  searchTerm,
  setSearchTerm,
  selectedStatus,
  handleStatusFilter,
  selectedPromoters,
  handleBulkAction
}: PromoterFiltersProps) {
  return (
    <div className="flex flex-col md:flex-row items-center justify-between gap-4">
      <div className="relative w-full max-w-sm">
        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          type="search"
          placeholder="Search promoters..."
          className="pl-8"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>
      
      <div className="flex items-center gap-2 w-full md:w-auto">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="flex items-center gap-2">
              <Filter className="h-4 w-4" />
              {selectedStatus ? `Filter: ${selectedStatus}` : "Filter"}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Filter by Status</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => handleStatusFilter(null)}>
              All
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleStatusFilter("approved")}>
              Approved
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleStatusFilter("pending")}>
              Pending
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleStatusFilter("rejected")}>
              Rejected
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        
        {selectedPromoters.length > 0 && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="default" className="flex items-center gap-2">
                Actions ({selectedPromoters.length})
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Bulk Actions</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => handleBulkAction("approve")} className="text-green-600">
                <CheckCheck className="h-4 w-4 mr-2" />
                Approve Selected
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleBulkAction("reject")} className="text-red-600">
                <UserX className="h-4 w-4 mr-2" />
                Reject Selected
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>
    </div>
  );
}
