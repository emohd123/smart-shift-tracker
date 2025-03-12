
import { useState } from "react";
import { Shift } from "./ShiftCard";
import { Button } from "@/components/ui/button";
import { 
  Plus, 
  Filter, 
  ChevronDown, 
  Trash2,
  X
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import ShiftGrid from "./ShiftGrid";
import { useAuth } from "@/context/AuthContext";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";

interface ShiftListProps {
  shifts: Shift[];
  title: string;
}

const ShiftList = ({ shifts, title }: ShiftListProps) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const isAdmin = user?.role === "admin";
  
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStatus, setSelectedStatus] = useState<string | null>(null);
  const [selectedShifts, setSelectedShifts] = useState<string[]>([]);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  
  // Filtering based on search query and status
  const filteredShifts = shifts.filter(shift => {
    const matchesSearch = shift.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          shift.location.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = selectedStatus ? shift.status === selectedStatus : true;
    
    return matchesSearch && matchesStatus;
  });
  
  const handleCreateClick = () => {
    navigate("/create-shift");
  };
  
  const handleSelectShift = (shiftId: string) => {
    setSelectedShifts(prev => {
      if (prev.includes(shiftId)) {
        return prev.filter(id => id !== shiftId);
      } else {
        return [...prev, shiftId];
      }
    });
  };
  
  const handleSelectAll = () => {
    if (selectedShifts.length === filteredShifts.length) {
      setSelectedShifts([]);
    } else {
      setSelectedShifts(filteredShifts.map(shift => shift.id));
    }
  };
  
  const handleDeleteSelected = async () => {
    if (selectedShifts.length === 0) return;
    
    setIsDeleting(true);
    try {
      // Delete shift assignments first
      await supabase
        .from('shift_assignments')
        .delete()
        .in('shift_id', selectedShifts);
      
      // Delete shift locations
      await supabase
        .from('shift_locations')
        .delete()
        .in('shift_id', selectedShifts);
      
      // Delete the shifts
      const { error } = await supabase
        .from('shifts')
        .delete()
        .in('id', selectedShifts);
      
      if (error) throw error;
      
      toast({
        title: "Success",
        description: `Successfully deleted ${selectedShifts.length} shift(s)`,
      });
      
      // For mock data, use the window.deleteShift function
      if (window.deleteShift) {
        selectedShifts.forEach(id => window.deleteShift(id));
      }
      
      setSelectedShifts([]);
    } catch (error: any) {
      console.error("Error deleting shifts:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to delete shifts",
        variant: "destructive"
      });
    } finally {
      setIsDeleting(false);
      setShowDeleteDialog(false);
    }
  };
  
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2">
          <h2 className="text-2xl font-bold">{title}</h2>
          {selectedShifts.length > 0 && (
            <Badge variant="outline" className="ml-2">
              {selectedShifts.length} selected
            </Badge>
          )}
        </div>
        {isAdmin && (
          <div className="flex items-center gap-2">
            {selectedShifts.length > 0 ? (
              <>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => setSelectedShifts([])}
                >
                  <X size={16} className="mr-1" />
                  Clear
                </Button>
                <Button 
                  variant="destructive" 
                  size="sm"
                  onClick={() => setShowDeleteDialog(true)}
                >
                  <Trash2 size={16} className="mr-1" />
                  Delete Selected
                </Button>
              </>
            ) : (
              <Button onClick={handleCreateClick}>
                <Plus size={16} className="mr-1" />
                Create Shift
              </Button>
            )}
          </div>
        )}
      </div>
      
      <div className="flex flex-col sm:flex-row gap-2">
        <div className="relative flex-1">
          <Input
            placeholder="Search shifts..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full"
          />
          {searchQuery && (
            <Button
              variant="ghost"
              size="sm"
              className="absolute right-1 top-1/2 transform -translate-y-1/2 h-8 w-8 p-0"
              onClick={() => setSearchQuery("")}
            >
              <X size={14} />
            </Button>
          )}
        </div>
        
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="w-[180px]">
              <Filter size={16} className="mr-1" />
              Status
              <ChevronDown size={14} className="ml-auto" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuGroup>
              <DropdownMenuItem onClick={() => setSelectedStatus(null)}>
                All Statuses
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setSelectedStatus("upcoming")}>
                Upcoming
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setSelectedStatus("ongoing")}>
                Ongoing
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setSelectedStatus("completed")}>
                Completed
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setSelectedStatus("cancelled")}>
                Cancelled
              </DropdownMenuItem>
            </DropdownMenuGroup>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      
      {isAdmin && (
        <div className="flex items-center mb-2">
          <Checkbox 
            id="select-all" 
            onCheckedChange={handleSelectAll} 
            checked={selectedShifts.length > 0 && selectedShifts.length === filteredShifts.length}
          />
          <label htmlFor="select-all" className="ml-2 text-sm">
            Select All
          </label>
        </div>
      )}
      
      {filteredShifts.length > 0 ? (
        <ShiftGrid 
          shifts={filteredShifts} 
          selectedShifts={selectedShifts}
          onSelectShift={isAdmin ? handleSelectShift : undefined}
        />
      ) : (
        <div className="text-center py-12 border rounded-md bg-background">
          <p className="text-muted-foreground">No shifts found{searchQuery ? ` matching "${searchQuery}"` : ""}.</p>
        </div>
      )}
      
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {selectedShifts.length} shift{selectedShifts.length !== 1 ? 's' : ''}?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the selected shifts
              and remove all associated data.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDeleteSelected}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground"
            >
              {isDeleting ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default ShiftList;
