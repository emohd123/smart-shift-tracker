import { CheckIcon, Phone, User, MapPin, Hash, RefreshCw, AlertCircle } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { PromoterOption } from "../types/PromoterTypes";
import { ScrollArea } from "@/components/ui/scroll-area";

interface PromoterSelectorProps {
  promoters: PromoterOption[];
  selectedPromoterIds: string[];
  onSelect: (value: string) => void;
  loading: boolean;
  error?: string | null;
  onRetry?: () => void;
}

export default function PromoterSelector({
  promoters,
  selectedPromoterIds,
  onSelect,
  loading,
  error,
  onRetry
}: PromoterSelectorProps) {
  // Get the names of selected promoters
  const getSelectedPromoterNames = () => {
    return promoters
      .filter(promoter => selectedPromoterIds.includes(promoter.id))
      .map(promoter => promoter.full_name);
  };

  return (
    <div className="space-y-2">
      <Label htmlFor="promoters">Assign Promoters (Optional)</Label>
      
      {/* Error message display */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-3 flex items-start gap-2">
          <AlertCircle className="h-4 w-4 text-red-500 mt-0.5 flex-shrink-0" />
          <div className="flex-1">
            <p className="text-sm text-red-800">{error}</p>
            {onRetry && (
              <Button
                variant="outline"
                size="sm"
                onClick={onRetry}
                className="mt-2 h-7 px-2 text-xs"
                disabled={loading}
              >
                <RefreshCw className={`h-3 w-3 mr-1 ${loading ? 'animate-spin' : ''}`} />
                Retry Loading
              </Button>
            )}
          </div>
        </div>
      )}
      
      <Popover>
        <PopoverTrigger asChild>
          <Button 
            variant="outline" 
            role="combobox" 
            className={`w-full justify-between ${error ? 'border-red-300' : ''}`}
            disabled={loading}
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <RefreshCw className="h-4 w-4 animate-spin" />
                Loading promoters...
              </span>
            ) : selectedPromoterIds.length === 0 ? (
              error ? "Failed to load promoters" : "Select promoters..."
            ) : (
              `${selectedPromoterIds.length} promoter${selectedPromoterIds.length > 1 ? 's' : ''} selected`
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="p-0 w-[var(--radix-popover-trigger-width)]" align="start" side="bottom" sideOffset={4}>
          <Command>
            <CommandInput placeholder="Search promoters..." />
            <CommandList>
              <CommandEmpty>
                {loading ? (
                  <div className="flex items-center justify-center py-6">
                    <RefreshCw className="h-4 w-4 animate-spin mr-2" />
                    Loading promoters...
                  </div>
                ) : error ? (
                  <div className="py-6 text-center">
                    <AlertCircle className="h-8 w-8 text-red-500 mx-auto mb-2" />
                    <p className="text-sm text-red-600 mb-2">{error}</p>
                    {onRetry && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={onRetry}
                        className="h-7 px-2 text-xs"
                      >
                        <RefreshCw className="h-3 w-3 mr-1" />
                        Retry
                      </Button>
                    )}
                  </div>
                ) : (
                  "No promoters found."
                )}
              </CommandEmpty>
              <CommandGroup>
                <CommandItem 
                  onSelect={() => onSelect("none")}
                  className="flex items-center"
                >
                  <div className={`mr-2 h-4 w-4 ${selectedPromoterIds.length === 0 ? "text-primary" : ""}`}>
                    {selectedPromoterIds.length === 0 && <CheckIcon className="h-4 w-4" />}
                  </div>
                  <span>None</span>
                </CommandItem>
                
                <ScrollArea className="h-[300px]">
                  {promoters.length === 0 && !loading && !error ? (
                    <div className="py-6 text-center text-sm text-muted-foreground">
                      <User className="h-8 w-8 mx-auto mb-2 opacity-50" />
                      <p>No approved promoters available</p>
                      <p className="text-xs mt-1">Promoters need approval before assignment</p>
                    </div>
                  ) : promoters.length > 0 ? (
                    promoters.map((promoter) => (
                      <CommandItem
                        key={promoter.id}
                        onSelect={() => onSelect(promoter.id)}
                        className="flex items-start justify-between p-3 hover:bg-muted/50"
                      >
                        <div className="flex items-center">
                          <div className={`mr-3 h-4 w-4 flex-shrink-0 ${selectedPromoterIds.includes(promoter.id) ? "text-primary" : ""}`}>
                            {selectedPromoterIds.includes(promoter.id) && <CheckIcon className="h-4 w-4" />}
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-medium text-sm">{promoter.full_name}</span>
                              <Badge variant="outline" className="text-xs font-mono">
                                {promoter.unique_code}
                              </Badge>
                            </div>
                            <div className="flex items-center gap-4 text-xs text-muted-foreground">
                              <div className="flex items-center gap-1">
                                <User className="h-3 w-3" />
                                <span>{promoter.age} years</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <MapPin className="h-3 w-3" />
                                <span>{promoter.nationality}</span>
                              </div>
                              {promoter.phone_number && (
                                <div className="flex items-center gap-1">
                                  <Phone className="h-3 w-3" />
                                  <span>{promoter.phone_number}</span>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </CommandItem>
                    ))
                  ) : null}
                </ScrollArea>
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
      
      {selectedPromoterIds.length > 0 && (
        <div className="flex flex-wrap gap-2 mt-2">
          {promoters
            .filter(promoter => selectedPromoterIds.includes(promoter.id))
            .map((promoter) => (
              <Badge key={promoter.id} variant="secondary" className="flex items-center gap-1">
                <span>{promoter.full_name}</span>
                <span className="text-xs font-mono">({promoter.unique_code})</span>
              </Badge>
            ))}
        </div>
      )}
    </div>
  );
}