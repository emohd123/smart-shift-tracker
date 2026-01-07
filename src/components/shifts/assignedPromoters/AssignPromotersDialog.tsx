import { useState, useEffect } from "react";
import { UserPlus, Search, Clock, AlertTriangle } from "lucide-react";
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
import { CheckCircle, AlertCircle } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useAssignPromoters } from "./hooks/useAssignPromoters";
import { PromoterOption } from "../types/PromoterTypes";
import { findOverlappingShifts, OverlappingShift } from "@/utils/shiftOverlapCheck";

type AssignPromotersDialogProps = {
  shiftId: string;
  currentAssignments?: string[];
  variant?: "default" | "outline";
  buttonText?: string;
  shiftStartTime?: string;
  shiftEndTime?: string;
  onSuccess?: () => void;
};

type PromoterSchedule = {
  promoterId: string;
  startTime: string;
  endTime: string;
  autoCheckIn: boolean;
  autoCheckOut: boolean;
};

export const AssignPromotersDialog = ({
  shiftId,
  currentAssignments = [],
  variant = "default",
  buttonText = "Assign Promoters",
  shiftStartTime = "09:00",
  shiftEndTime = "17:00",
  onSuccess,
}: AssignPromotersDialogProps) => {
  const [open, setOpen] = useState(false);
  const [promoters, setPromoters] = useState<PromoterOption[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [uniqueCode, setUniqueCode] = useState("");
  const [loading, setLoading] = useState(true);
  const [schedules, setSchedules] = useState<{ [key: string]: PromoterSchedule }>({});
  const [bulkStartTime, setBulkStartTime] = useState(shiftStartTime);
  const [bulkEndTime, setBulkEndTime] = useState(shiftEndTime);
  const [contractStatuses, setContractStatuses] = useState<{ [key: string]: boolean }>({});
  const [companyId, setCompanyId] = useState<string>('');
  const [shiftDetails, setShiftDetails] = useState<{
    date: string;
    end_date: string | null;
    start_time: string;
    end_time: string;
  } | null>(null);
  const [overlapWarnings, setOverlapWarnings] = useState<{ [promoterId: string]: OverlappingShift[] }>({});
  
  const { assignPromoters, loading: assigning } = useAssignPromoters(shiftId);

  useEffect(() => {
    if (open) {
      fetchPromotersAndContracts();
      setSelectedIds([]);
      setSchedules({});
    }
  }, [open]);

  const fetchPromotersAndContracts = async () => {
    setLoading(true);
    try {
            // Get shift details to find company_id and shift timing
            const { data: shiftData } = await supabase
              .from('shifts')
              .select('company_id, date, end_date, start_time, end_time')
              .eq('id', shiftId)
              .single();

            if (shiftData) {
              setCompanyId(shiftData.company_id);
              setShiftDetails({
                date: shiftData.date,
                end_date: shiftData.end_date,
                start_time: shiftData.start_time,
                end_time: shiftData.end_time,
              });

              // Check if shift has a contract template
              const { data: shiftTemplate } = await supabase
                .from('shift_contract_templates')
                .select('id')
                .eq('shift_id', shiftId)
                .maybeSingle();

              if (shiftTemplate) {
                // Get all accepted contract acceptances for this specific shift
                const { data: acceptances } = await supabase
                  .from('company_contract_acceptances')
                  .select('promoter_id')
                  .eq('shift_id', shiftId)
                  .eq('status', 'accepted')
                  .is('superseded_at', null);

                const statusMap: { [key: string]: boolean } = {};
                acceptances?.forEach(a => {
                  statusMap[a.promoter_id] = true;
                });
                setContractStatuses(statusMap);
              }
            }

      // Try RPC first (if migration has been applied)
      const { data: rpcData, error: rpcError } = await supabase.rpc('list_eligible_promoters').then(
        (result) => result,
        () => ({ data: null, error: new Error('RPC not available') })
      );

      let promoterRows: any[] = [];

      if (rpcData && !rpcError) {
        promoterRows = rpcData;
        console.log('Loaded promoters from RPC');
      } else {
        // Fallback: Direct select for approved promoters
        console.warn('RPC not available, falling back to profiles select');
        const { data: fallbackData, error: fallbackError } = await supabase
          .from('profiles')
          .select('id, unique_code, full_name, email, age, nationality, phone_number, gender, profile_photo_url, verification_status')
          .eq('role', 'promoter')
          .eq('verification_status', 'approved')
          .order('full_name', { ascending: true });

        if (fallbackError) {
          console.error("Error fetching promoters:", fallbackError);
          throw fallbackError;
        }
        promoterRows = fallbackData || [];
      }
      
      if (!promoterRows || promoterRows.length === 0) {
        console.log("No approved promoters found");
        toast.info("No approved promoters available");
      }
      
      setPromoters(promoterRows);
    } catch (error: any) {
      console.error("Error fetching promoters:", error);
      toast.error(`Failed to load promoters: ${error.message || 'Unknown error'}`);
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
    setSchedules(prev => ({
      ...prev,
      [promoter.id]: {
        promoterId: promoter.id,
        startTime: shiftStartTime,
        endTime: shiftEndTime,
        autoCheckIn: true,
        autoCheckOut: true,
      }
    }));
    toast.success(`Added ${promoter.full_name} (${promoter.unique_code})`);
    setUniqueCode("");
  };

  const togglePromoter = async (id: string) => {
    setSelectedIds(prev => {
      const newIds = prev.includes(id) 
        ? prev.filter(i => i !== id)
        : [...prev, id];
      
      // Initialize schedule for newly selected promoters
      if (!prev.includes(id) && newIds.includes(id)) {
        setSchedules(prev => ({
          ...prev,
          [id]: {
            promoterId: id,
            startTime: shiftStartTime,
            endTime: shiftEndTime,
            autoCheckIn: true,
            autoCheckOut: true,
          }
        }));

        // Check for overlapping shifts when promoter is selected
        if (shiftDetails) {
          checkOverlappingShifts(id, shiftDetails);
        }
      } else if (prev.includes(id) && !newIds.includes(id)) {
        // Remove overlap warning when promoter is deselected
        setOverlapWarnings(prev => {
          const updated = { ...prev };
          delete updated[id];
          return updated;
        });
      }
      
      return newIds;
    });
  };

  const checkOverlappingShifts = async (
    promoterId: string,
    shiftInfo: { date: string; end_date: string | null; start_time: string; end_time: string }
  ) => {
    try {
      const overlapping = await findOverlappingShifts(
        shiftId,
        promoterId,
        shiftInfo.date,
        shiftInfo.end_date,
        shiftInfo.start_time,
        shiftInfo.end_time
      );

      if (overlapping.length > 0) {
        setOverlapWarnings(prev => ({
          ...prev,
          [promoterId]: overlapping
        }));
      }
    } catch (error) {
      console.error('Error checking overlapping shifts:', error);
    }
  };

  const updateSchedule = (promoterId: string, updates: Partial<PromoterSchedule>) => {
    setSchedules(prev => ({
      ...prev,
      [promoterId]: { ...prev[promoterId], ...updates }
    }));
  };

  const applyBulkTime = () => {
    if (!bulkStartTime || !bulkEndTime) {
      toast.error("Please set both start and end times");
      return;
    }

    if (bulkStartTime >= bulkEndTime) {
      toast.error("Start time must be before end time");
      return;
    }

    const updates: { [key: string]: PromoterSchedule } = {};
    selectedIds.forEach(id => {
      updates[id] = {
        ...schedules[id],
        startTime: bulkStartTime,
        endTime: bulkEndTime,
      };
    });
    setSchedules(prev => ({ ...prev, ...updates }));
    toast.success(`Applied ${bulkStartTime} - ${bulkEndTime} to ${selectedIds.length} promoter(s)`);
  };

  const handleSave = async () => {
    const newAssignments = selectedIds.filter(
      id => !currentAssignments.includes(id)
    );

    if (newAssignments.length === 0) {
      toast.info("No new promoters to assign");
      return;
    }

    // Check for overlapping shifts before assigning
    if (shiftDetails) {
      const hasOverlaps = newAssignments.some(id => overlapWarnings[id] && overlapWarnings[id].length > 0);
      if (hasOverlaps) {
        const overlappingPromoters = newAssignments.filter(id => overlapWarnings[id] && overlapWarnings[id].length > 0);
        toast.error(
          `Cannot assign ${overlappingPromoters.length} promoter(s) due to overlapping shifts`,
          {
            description: "Please review the warnings below and unassign conflicting shifts first."
          }
        );
        return;
      }
    }

    for (const id of newAssignments) {
      const schedule = schedules[id];
      if (!schedule?.startTime || !schedule?.endTime) {
        toast.error("Please set work hours for all promoters");
        return;
      }
      if (schedule.startTime >= schedule.endTime) {
        toast.error("Start time must be before end time for all promoters");
        return;
      }
    }

    const success = await assignPromoters(newAssignments, schedules);
    if (success) {
      setOpen(false);
      setSelectedIds([]);
      setSearchQuery("");
      setUniqueCode("");
      setSchedules({});
      setOverlapWarnings({});
      onSuccess?.();
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
      <DialogContent className="max-w-3xl max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Assign Promoters</DialogTitle>
          <DialogDescription>
            Select promoters and set their work hours (Shift: {shiftStartTime} - {shiftEndTime})
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

          {/* Bulk Time Assignment */}
          {selectedIds.length > 0 && (
            <div className="space-y-2 p-3 border rounded-lg bg-accent/50">
              <Label className="text-sm font-medium">Apply Same Time to All Selected</Label>
              <div className="flex gap-2 items-end">
                <div className="flex-1">
                  <Label className="text-xs">Start Time</Label>
                  <Input
                    type="time"
                    value={bulkStartTime}
                    onChange={(e) => setBulkStartTime(e.target.value)}
                    className="h-9"
                  />
                </div>
                <div className="flex-1">
                  <Label className="text-xs">End Time</Label>
                  <Input
                    type="time"
                    value={bulkEndTime}
                    onChange={(e) => setBulkEndTime(e.target.value)}
                    className="h-9"
                  />
                </div>
                <Button onClick={applyBulkTime} size="sm" className="h-9">
                  <Clock className="h-3.5 w-3.5 mr-1" />
                  Apply
                </Button>
              </div>
            </div>
          )}

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
              <div className="p-4 space-y-3">
                {filteredPromoters.map((promoter) => {
                  const isAssigned = currentAssignments.includes(promoter.id);
                  const isSelected = selectedIds.includes(promoter.id);
                  const schedule = schedules[promoter.id];
                  
                  return (
                    <div key={promoter.id} className="border rounded-lg p-3 space-y-2">
                      <div className="flex items-start gap-3">
                        <Checkbox
                          id={promoter.id}
                          checked={isSelected || isAssigned}
                          disabled={isAssigned}
                          onCheckedChange={() => !isAssigned && togglePromoter(promoter.id)}
                          className="mt-1"
                        />
                        <label htmlFor={promoter.id} className="flex-1 cursor-pointer">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-medium">{promoter.full_name}</span>
                            {isAssigned && <Badge variant="secondary" className="text-xs">Already Assigned</Badge>}
                            {isSelected && overlapWarnings[promoter.id] && overlapWarnings[promoter.id].length > 0 && (
                              <Badge variant="destructive" className="text-xs">
                                <AlertTriangle className="h-3 w-3 mr-1" />
                                Overlapping Shift
                              </Badge>
                            )}
                            {contractStatuses[promoter.id] ? (
                              <Badge variant="default" className="text-xs">
                                <CheckCircle className="h-3 w-3 mr-1" />
                                Contract Signed
                              </Badge>
                            ) : contractStatuses[promoter.id] === false ? (
                              <Badge variant="outline" className="text-xs text-amber-600 border-amber-600">
                                <AlertCircle className="h-3 w-3 mr-1" />
                                Awaiting Contract
                              </Badge>
                            ) : null}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            Code: {promoter.unique_code}
                            {promoter.nationality && ` • ${promoter.nationality}`}
                            {promoter.age && ` • Age ${promoter.age}`}
                          </div>
                        </label>
                      </div>
                      {isSelected && schedule && (
                        <div className="ml-8 space-y-2 pt-2 border-t">
                          {/* Overlap Warning */}
                          {overlapWarnings[promoter.id] && overlapWarnings[promoter.id].length > 0 && (
                            <Alert variant="destructive" className="mb-2">
                              <AlertTriangle className="h-4 w-4" />
                              <AlertTitle>Overlapping Shift Conflict</AlertTitle>
                              <AlertDescription className="mt-1">
                                <p className="text-xs mb-2">This promoter is already assigned to {overlapWarnings[promoter.id].length} overlapping shift(s):</p>
                                <ul className="text-xs list-disc list-inside space-y-1">
                                  {overlapWarnings[promoter.id].map((overlap) => (
                                    <li key={overlap.shift_id}>
                                      <strong>{overlap.title}</strong> - {new Date(overlap.date).toLocaleDateString()}
                                      {overlap.end_date && overlap.end_date !== overlap.date && ` to ${new Date(overlap.end_date).toLocaleDateString()}`}
                                      {' '}({overlap.start_time} - {overlap.end_time})
                                    </li>
                                  ))}
                                </ul>
                                <p className="text-xs mt-2 font-semibold">Cannot assign promoter to overlapping shifts.</p>
                              </AlertDescription>
                            </Alert>
                          )}
                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <Label className="text-xs">Work Start</Label>
                              <Input type="time" value={schedule.startTime} onChange={(e) => updateSchedule(promoter.id, { startTime: e.target.value })} className="h-8 text-sm" />
                            </div>
                            <div>
                              <Label className="text-xs">Work End</Label>
                              <Input type="time" value={schedule.endTime} onChange={(e) => updateSchedule(promoter.id, { endTime: e.target.value })} className="h-8 text-sm" />
                            </div>
                          </div>
                          <div className="flex items-center justify-between text-xs">
                            <div className="flex items-center gap-2">
                              <Switch checked={schedule.autoCheckIn} onCheckedChange={(checked) => updateSchedule(promoter.id, { autoCheckIn: checked })} className="scale-75" />
                              <span>Auto check-in</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Switch checked={schedule.autoCheckOut} onCheckedChange={(checked) => updateSchedule(promoter.id, { autoCheckOut: checked })} className="scale-75" />
                              <span>Auto check-out</span>
                            </div>
                          </div>
                        </div>
                      )}
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
