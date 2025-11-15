import { useState, useEffect } from "react";
import { UserPlus, Search } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useAssignPromoters } from "./hooks/useAssignPromoters";
import { PromoterOption } from "../types/PromoterTypes";

type AssignPromotersDialogProps = {
  shiftId: string;
  currentAssignments?: string[];
  variant?: "default" | "outline";
  buttonText?: string;
};

export const AssignPromotersDialog = ({
  shiftId,
  currentAssignments = [],
  variant = "default",
  buttonText = "Assign Promoters",
}: AssignPromotersDialogProps) => {
  const [open, setOpen] = useState(false);
  const [promoters, setPromoters] = useState<PromoterOption[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [uniqueCode, setUniqueCode] = useState("");
  const [loading, setLoading] = useState(true);
  
  const { assignPromoters, loading: assigning } = useAssignPromoters(shiftId);

  useEffect(() => {
    if (open) {
      fetchPromoters();
      setSelectedIds([]);
    }
  }, [open]);

  const fetchPromoters = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, full_name, unique_code, age, nationality, phone_number")
        .eq("role", "promoter")
        .eq("verification_status", "approved")
        .order("full_name");

      if (error) throw error;
      setPromoters(data || []);
    } catch (error: any) {
      console.error("Error fetching promoters:", error);
      toast.error("Failed to load promoters");
    } finally {
      setLoading(false);
    }
  };

  const handleQuickAdd = () => {
    if (!uniqueCode.trim()) {
      toast.error("Please enter a unique code");
      return;
    }

    const promoter = promoters.find(
      p => p.unique_code?.toUpperCase() === uniqueCode.trim().toUpperCase()
    );

    if (!promoter) {
      toast.error(`No promoter found with code: ${uniqueCode.trim()}`);
      return;
    }

    if (currentAssignments.includes(promoter.id)) {
      toast.info(`${promoter.full_name} is already assigned`);
      return;
    }

    if (selectedIds.includes(promoter.id)) {
      toast.info(`${promoter.full_name} is already selected`);
      return;
    }

    setSelectedIds(prev => [...prev, promoter.id]);
    toast.success(`Added ${promoter.full_name} (${promoter.unique_code})`);
    setUniqueCode("");
  };

  const togglePromoter = (id: string) => {
    setSelectedIds(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const handleSave = async () => {
    const newAssignments = selectedIds.filter(
      id => !currentAssignments.includes(id)
    );

    if (newAssignments.length === 0) {
      toast.info("No new promoters to assign");
      return;
    }

    const success = await assignPromoters(newAssignments);
    if (success) {
      setOpen(false);
      setSelectedIds([]);
      setSearchQuery("");
      setUniqueCode("");
    }
  };

  const filteredPromoters = promoters.filter(p => {
    const query = searchQuery.toLowerCase();
    return (
      p.full_name?.toLowerCase().includes(query) ||
      p.unique_code?.toLowerCase().includes(query) ||
      p.nationality?.toLowerCase().includes(query)
    );
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant={variant}>
          <UserPlus className="h-4 w-4 mr-2" />
          {buttonText}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Assign Promoters</DialogTitle>
          <DialogDescription>
            Select promoters to assign to this shift
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 flex-1 overflow-hidden flex flex-col">
          {/* Quick Add by Code */}
          <div className="space-y-2">
            <Label>Quick Add by Code</Label>
            <div className="flex gap-2">
              <Input
                placeholder="Enter unique code (e.g., PROMO-ABC123)"
                value={uniqueCode}
                onChange={(e) => setUniqueCode(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleQuickAdd();
                  }
                }}
                className="font-mono"
              />
              <Button 
                type="button" 
                onClick={handleQuickAdd}
                variant="secondary"
              >
                <Search className="h-4 w-4 mr-2" />
                Add
              </Button>
            </div>
          </div>

          {/* Search */}
          <div className="space-y-2">
            <Label>Browse All Promoters</Label>
            <Input
              placeholder="Search by name, code, or nationality..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          {/* Promoters List */}
          <ScrollArea className="flex-1 border rounded-md">
            {loading ? (
              <div className="p-8 text-center text-muted-foreground">
                Loading promoters...
              </div>
            ) : filteredPromoters.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground">
                No promoters found
              </div>
            ) : (
              <div className="p-4 space-y-2">
                {filteredPromoters.map((promoter) => {
                  const isAssigned = currentAssignments.includes(promoter.id);
                  const isSelected = selectedIds.includes(promoter.id);
                  
                  return (
                    <div
                      key={promoter.id}
                      className="flex items-start gap-3 p-3 border rounded-lg hover:bg-accent/50 transition-colors"
                    >
                      <Checkbox
                        id={promoter.id}
                        checked={isSelected || isAssigned}
                        disabled={isAssigned}
                        onCheckedChange={() => !isAssigned && togglePromoter(promoter.id)}
                        className="mt-1"
                      />
                      <label
                        htmlFor={promoter.id}
                        className="flex-1 cursor-pointer space-y-1"
                      >
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{promoter.full_name}</span>
                          {isAssigned && (
                            <Badge variant="secondary" className="text-xs">
                              Already Assigned
                            </Badge>
                          )}
                        </div>
                        <div className="text-sm text-muted-foreground space-y-0.5">
                          <div>Code: {promoter.unique_code}</div>
                          {promoter.nationality && (
                            <div>Nationality: {promoter.nationality}</div>
                          )}
                          {promoter.age && <div>Age: {promoter.age}</div>}
                        </div>
                      </label>
                    </div>
                  );
                })}
              </div>
            )}
          </ScrollArea>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button 
            onClick={handleSave} 
            disabled={assigning || selectedIds.length === 0}
          >
            {assigning ? "Assigning..." : `Assign ${selectedIds.length} Promoter${selectedIds.length !== 1 ? 's' : ''}`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
