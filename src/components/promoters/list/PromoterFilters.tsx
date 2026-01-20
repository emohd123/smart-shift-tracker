
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
import { 
  CheckCheck, 
  Filter, 
  Search, 
  UserX, 
  BadgeCheck, 
  Clock, 
  UserCog, 
  AlertTriangle,
  MessageSquare
} from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { ExportButton } from "@/components/admin/shared/ExportButton";

interface PromoterFiltersProps {
  searchTerm: string;
  setSearchTerm: (value: string) => void;
  selectedStatus: string | null;
  handleStatusFilter: (status: string | null) => void;
  selectedPromoters: string[];
  handleBulkAction: (action: string) => void;
  exportData: () => any[];
  onBulkRequestChanges?: () => void;
}

export function PromoterFilters({
  searchTerm,
  setSearchTerm,
  selectedStatus,
  handleStatusFilter,
  selectedPromoters,
  handleBulkAction,
  exportData,
  onBulkRequestChanges
}: PromoterFiltersProps) {
  const getStatusIcon = (status: string | null) => {
    switch (status) {
      case "approved":
        return <BadgeCheck className="h-4 w-4 text-green-600" />;
      case "pending":
        return <Clock className="h-4 w-4 text-yellow-600" />;
      case "rejected":
        return <AlertTriangle className="h-4 w-4 text-red-600" />;
      default:
        return <UserCog className="h-4 w-4 text-muted-foreground" />;
    }
  };

  return (
    <Card className="mb-4">
      <CardContent className="p-4">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="relative w-full max-w-sm flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search promoters..."
                className="pl-8 bg-background"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <HelpTooltip content={tooltips.company.promoters.search} />
          </div>
          
          <div className="flex items-center gap-2 w-full md:w-auto">
            <div className="flex items-center gap-2">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="flex items-center gap-2 bg-background">
                    {getStatusIcon(selectedStatus)}
                    <span>
                      {selectedStatus 
                        ? `${selectedStatus.charAt(0).toUpperCase() + selectedStatus.slice(1)}` 
                        : "All Statuses"}
                    </span>
                  </Button>
                </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>Filter by Status</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem 
                  onClick={() => handleStatusFilter(null)}
                  className="flex items-center gap-2"
                >
                  <UserCog className="h-4 w-4" />
                  All Statuses
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onClick={() => handleStatusFilter("approved")}
                  className="flex items-center gap-2 text-green-600"
                >
                  <BadgeCheck className="h-4 w-4" />
                  Approved
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onClick={() => handleStatusFilter("pending")}
                  className="flex items-center gap-2 text-yellow-600"
                >
                  <Clock className="h-4 w-4" />
                  Pending
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onClick={() => handleStatusFilter("rejected")}
                  className="flex items-center gap-2 text-red-600"
                >
                  <AlertTriangle className="h-4 w-4" />
                  Rejected
                </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              <HelpTooltip content={tooltips.company.promoters.statusFilter} />
            </div>
            
            {selectedPromoters.length > 0 && (
              <div className="flex items-center gap-2">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="default" className="flex items-center gap-2">
                      Actions
                      <Badge variant="secondary" className="ml-1 bg-primary/20 text-primary">
                        {selectedPromoters.length}
                      </Badge>
                    </Button>
                  </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuLabel>Bulk Actions</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem 
                    onClick={() => handleBulkAction("approve")} 
                    className="text-green-600 flex items-center gap-2"
                  >
                    <CheckCheck className="h-4 w-4" />
                    Approve Selected
                  </DropdownMenuItem>
                  <DropdownMenuItem 
                    onClick={() => handleBulkAction("reject")} 
                    className="text-red-600 flex items-center gap-2"
                  >
                    <UserX className="h-4 w-4" />
                    Reject Selected
                  </DropdownMenuItem>
                  {onBulkRequestChanges && (
                    <>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem 
                        onClick={onBulkRequestChanges}
                        className="text-blue-600 flex items-center gap-2"
                      >
                        <MessageSquare className="h-4 w-4" />
                        Request Changes
                      </DropdownMenuItem>
                    </>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
              <HelpTooltip content={tooltips.company.promoters.bulkActions} />
            </div>
            )}

            <ExportButton
              data={exportData()}
              filename="promoters-report"
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
