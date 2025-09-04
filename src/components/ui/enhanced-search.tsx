import React, { useState, useMemo } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, X, Filter, SortAsc, SortDesc } from "lucide-react";
import { useDebounce } from "@/hooks/usePerformance";

interface FilterOption {
  label: string;
  value: string;
}

interface SortOption {
  label: string;
  value: string;
  direction?: "asc" | "desc";
}

interface EnhancedSearchProps {
  placeholder?: string;
  onSearch: (term: string) => void;
  onFilter?: (filters: Record<string, string>) => void;
  onSort?: (sort: SortOption) => void;
  filterOptions?: Array<{
    key: string;
    label: string;
    options: FilterOption[];
  }>;
  sortOptions?: SortOption[];
  showFilters?: boolean;
  showSort?: boolean;
  className?: string;
}

export const EnhancedSearch: React.FC<EnhancedSearchProps> = ({
  placeholder = "Search...",
  onSearch,
  onFilter,
  onSort,
  filterOptions = [],
  sortOptions = [],
  showFilters = true,
  showSort = true,
  className
}) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [activeFilters, setActiveFilters] = useState<Record<string, string>>({});
  const [currentSort, setCurrentSort] = useState<SortOption | null>(null);
  const [showFilterPanel, setShowFilterPanel] = useState(false);

  const debouncedSearch = useDebounce(onSearch, 300);

  const handleSearchChange = (value: string) => {
    setSearchTerm(value);
    debouncedSearch(value);
  };

  const handleFilterChange = (key: string, value: string) => {
    const newFilters = { ...activeFilters };
    if (value) {
      newFilters[key] = value;
    } else {
      delete newFilters[key];
    }
    setActiveFilters(newFilters);
    onFilter?.(newFilters);
  };

  const handleSortChange = (sortValue: string) => {
    const sort = sortOptions.find(s => s.value === sortValue);
    if (sort) {
      setCurrentSort(sort);
      onSort?.(sort);
    }
  };

  const clearFilters = () => {
    setActiveFilters({});
    onFilter?.({});
  };

  const activeFilterCount = Object.keys(activeFilters).length;

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
        <Input
          type="text"
          placeholder={placeholder}
          value={searchTerm}
          onChange={(e) => handleSearchChange(e.target.value)}
          className="pl-10 pr-4"
        />
        {searchTerm && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleSearchChange("")}
            className="absolute right-2 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0"
          >
            <X className="h-3 w-3" />
          </Button>
        )}
      </div>

      {/* Filter and Sort Controls */}
      {(showFilters || showSort) && (
        <div className="flex flex-wrap items-center gap-2">
          {showFilters && filterOptions.length > 0 && (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowFilterPanel(!showFilterPanel)}
                className="flex items-center gap-2"
              >
                <Filter className="h-4 w-4" />
                Filters
                {activeFilterCount > 0 && (
                  <Badge variant="secondary" className="ml-1 h-5 text-xs">
                    {activeFilterCount}
                  </Badge>
                )}
              </Button>
              
              {activeFilterCount > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearFilters}
                  className="text-muted-foreground"
                >
                  Clear all
                </Button>
              )}
            </>
          )}

          {showSort && sortOptions.length > 0 && (
            <Select onValueChange={handleSortChange}>
              <SelectTrigger className="w-auto">
                <div className="flex items-center gap-2">
                  {currentSort?.direction === "desc" ? (
                    <SortDesc className="h-4 w-4" />
                  ) : (
                    <SortAsc className="h-4 w-4" />
                  )}
                  <SelectValue placeholder="Sort by" />
                </div>
              </SelectTrigger>
              <SelectContent>
                {sortOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>
      )}

      {/* Filter Panel */}
      {showFilterPanel && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-4 border rounded-lg bg-muted/5">
          {filterOptions.map((filterGroup) => (
            <div key={filterGroup.key} className="space-y-2">
              <label className="text-sm font-medium">{filterGroup.label}</label>
              <Select
                value={activeFilters[filterGroup.key] || ""}
                onValueChange={(value) => handleFilterChange(filterGroup.key, value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder={`Select ${filterGroup.label.toLowerCase()}`} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All</SelectItem>
                  {filterGroup.options.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          ))}
        </div>
      )}

      {/* Active Filters Display */}
      {activeFilterCount > 0 && (
        <div className="flex flex-wrap gap-2">
          {Object.entries(activeFilters).map(([key, value]) => {
            const filterGroup = filterOptions.find(f => f.key === key);
            const option = filterGroup?.options.find(o => o.value === value);
            
            return (
              <Badge key={key} variant="secondary" className="flex items-center gap-1">
                {filterGroup?.label}: {option?.label || value}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleFilterChange(key, "")}
                  className="h-4 w-4 p-0 ml-1"
                >
                  <X className="h-3 w-3" />
                </Button>
              </Badge>
            );
          })}
        </div>
      )}
    </div>
  );
};