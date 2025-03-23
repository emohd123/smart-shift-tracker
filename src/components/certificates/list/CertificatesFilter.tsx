
import { Search, Filter } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { Separator } from "@/components/ui/separator";

type CertificatesFilterProps = {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  onFilterChange: (filterType: string) => void;
};

export default function CertificatesFilter({ 
  searchTerm, 
  onSearchChange, 
  onFilterChange 
}: CertificatesFilterProps) {
  return (
    <div className="flex flex-col sm:flex-row items-center gap-2 mb-6">
      <div className="relative flex-1 w-full">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search certificates..."
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-9 w-full"
        />
      </div>
      
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm" className="flex items-center gap-1 whitespace-nowrap">
            <Filter className="h-4 w-4" />
            Filter
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={() => onFilterChange("all")}>
            All Certificates
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => onFilterChange("recent")}>
            Recently Generated
          </DropdownMenuItem>
          <Separator className="my-1" />
          <DropdownMenuItem onClick={() => onFilterChange("3months")}>
            3 Months Certificates
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => onFilterChange("6months")}>
            6 Months Certificates
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => onFilterChange("1year")}>
            1 Year Certificates
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
