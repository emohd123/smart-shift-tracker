
import { CheckIcon, Phone } from "lucide-react";
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
}

export default function PromoterSelector({
  promoters,
  selectedPromoterIds,
  onSelect,
  loading
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
      
      <Popover>
        <PopoverTrigger asChild>
          <Button 
            variant="outline" 
            role="combobox" 
            className="w-full justify-between"
          >
            {selectedPromoterIds.length === 0 
              ? "Select promoters..." 
              : `${selectedPromoterIds.length} promoter${selectedPromoterIds.length > 1 ? 's' : ''} selected`}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="p-0" align="start" side="bottom" sideOffset={4} width="target">
          <Command>
            <CommandInput placeholder="Search promoters..." />
            <CommandList>
              <CommandEmpty>
                {loading ? "Loading promoters..." : "No promoters found."}
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
                
                <ScrollArea className="h-[200px]">
                  {promoters.length === 0 && !loading ? (
                    <div className="py-6 text-center text-sm text-muted-foreground">
                      No approved promoters available
                    </div>
                  ) : (
                    promoters.map((promoter) => (
                      <CommandItem
                        key={promoter.id}
                        onSelect={() => onSelect(promoter.id)}
                        className="flex items-center justify-between"
                      >
                        <div className="flex items-center">
                          <div className={`mr-2 h-4 w-4 ${selectedPromoterIds.includes(promoter.id) ? "text-primary" : ""}`}>
                            {selectedPromoterIds.includes(promoter.id) && <CheckIcon className="h-4 w-4" />}
                          </div>
                          <span>{promoter.full_name}</span>
                        </div>
                        {promoter.phone_number && (
                          <div className="flex items-center text-xs text-muted-foreground">
                            <Phone className="h-3 w-3 mr-1" />
                            {promoter.phone_number}
                          </div>
                        )}
                      </CommandItem>
                    ))
                  )}
                </ScrollArea>
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
      
      {selectedPromoterIds.length > 0 && (
        <div className="flex flex-wrap gap-2 mt-2">
          {getSelectedPromoterNames().map((name, index) => (
            <Badge key={index} variant="secondary">
              {name}
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
}
