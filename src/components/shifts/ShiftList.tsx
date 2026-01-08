import { useState, useMemo } from "react";
import { useAuth } from "@/context/AuthContext";
import { isAdminLike } from "@/utils/roleUtils";
import { Shift } from "./types/ShiftTypes";
import { toast } from "sonner";
import ShiftGrid from "./ShiftGrid";
import SearchBar from "./list/SearchBar";
import ShiftListHeader from "./list/ShiftListHeader";
import BulkDeleteButton from "./list/BulkDeleteButton";
import EmptyShifts from "./list/EmptyShifts";
import BulkPayRateDialog from "./list/BulkPayRateDialog";
import { Button } from "@/components/ui/button";
import { DollarSign, ArrowUpDown } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { getEffectiveStatus } from "./utils/statusCalculations";

interface ShiftListProps {
  shifts: Shift[];
  title?: string;
  deleteShift?: (id: string) => void;
  refreshShifts?: () => void;
  deleteAllShifts?: () => Promise<void>;
}

type SortOption = "date-desc" | "date-asc" | "status" | "company" | "title";

const ShiftList = ({ shifts, title = "Shifts", deleteShift, refreshShifts, deleteAllShifts }: ShiftListProps) => {
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedShifts, setSelectedShifts] = useState<string[]>([]);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showBulkPayRateDialog, setShowBulkPayRateDialog] = useState(false);
  const [sortBy, setSortBy] = useState<SortOption>("date-desc");

  const isAdmin = isAdminLike(user?.role);

  const filteredAndSortedShifts = useMemo(() => {
    // Filter by search term
    let filtered = shifts.filter(shift =>
      shift.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      shift.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
      shift.date.includes(searchTerm) ||
      shift.companyName?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // Sort
    filtered = [...filtered].sort((a, b) => {
      switch (sortBy) {
        case "date-desc":
          return new Date(b.date).getTime() - new Date(a.date).getTime();
        case "date-asc":
          return new Date(a.date).getTime() - new Date(b.date).getTime();
        case "status":
          const statusA = getEffectiveStatus(a);
          const statusB = getEffectiveStatus(b);
          return statusA.localeCompare(statusB);
        case "company":
          return (a.companyName || "").localeCompare(b.companyName || "");
        case "title":
          return a.title.localeCompare(b.title);
        default:
          return 0;
      }
    });

    return filtered;
  }, [shifts, searchTerm, sortBy]);

  const handleSelectShift = (shiftId: string) => {
    setSelectedShifts(prev =>
      prev.includes(shiftId)
        ? prev.filter(id => id !== shiftId)
        : [...prev, shiftId]
    );
  };

  const handleRefresh = async () => {
    if (!refreshShifts) return;

    setIsRefreshing(true);

    try {
      await refreshShifts();
      toast.success("Data Refreshed", {
        description: "The shifts list has been updated with the latest data"
      });
    } catch (error) {
      console.error("Error refreshing data:", error);
      toast.error("Refresh Failed", {
        description: "Could not refresh data. Please try again."
      });
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleBulkDelete = async () => {
    if (selectedShifts.length === 0) return;

    setIsDeleting(true);

    try {


      const deletePromises = selectedShifts.map(async (id) => {
        try {


          if (deleteShift) {
            await deleteShift(id);
            return { id, success: true };
          } else if (window.deleteShift) {
            window.deleteShift(id);
            return { id, success: true };
          }
          return { id, success: false, error: "No delete function available" };
        } catch (error) {
          console.error(`Error deleting shift ${id}:`, error);
          return { id, success: false, error };
        }
      });

      const results = await Promise.all(deletePromises);
      const successful = results.filter(r => r.success).length;

      if (successful > 0) {
        toast.success("Success", {
          description: `${successful} shift${successful > 1 ? 's' : ''} deleted successfully`
        });

        if (refreshShifts) {
          await refreshShifts();
        }
      }

      if (successful < selectedShifts.length) {
        toast.error("Warning", {
          description: `${selectedShifts.length - successful} shift(s) could not be deleted`
        });
      }

      setSelectedShifts([]);

    } catch (error) {
      console.error("Error in bulk delete operation:", error);
      toast.error("Error", {
        description: "Failed to complete delete operation"
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const handleBulkPayRateSuccess = async () => {
    setSelectedShifts([]);
    if (refreshShifts) {
      await refreshShifts();
    }
  };

  return (
    <div className="space-y-4">
      <ShiftListHeader
        title={title}
        isAdmin={isAdmin}
        isRefreshing={isRefreshing}
        handleRefresh={handleRefresh}
        refreshShifts={refreshShifts}
        deleteAllShifts={deleteAllShifts}
      />

      <div className="flex gap-4 items-center flex-wrap">
        <SearchBar
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
        />
        <Select value={sortBy} onValueChange={(value) => setSortBy(value as SortOption)}>
          <SelectTrigger className="w-[180px]">
            <ArrowUpDown className="h-4 w-4 mr-2" />
            <SelectValue placeholder="Sort by" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="date-desc">Date (Newest)</SelectItem>
            <SelectItem value="date-asc">Date (Oldest)</SelectItem>
            <SelectItem value="status">Status</SelectItem>
            <SelectItem value="company">Company</SelectItem>
            <SelectItem value="title">Title</SelectItem>
          </SelectContent>
        </Select>

        {isAdmin && selectedShifts.length > 0 && (
          <>
            <Button
              variant="secondary"
              onClick={() => setShowBulkPayRateDialog(true)}
              className="gap-2"
            >
              <DollarSign className="h-4 w-4" />
              Update Pay Rates ({selectedShifts.length})
            </Button>
            <BulkDeleteButton
              selectedCount={selectedShifts.length}
              isDeleting={isDeleting}
              onBulkDelete={handleBulkDelete}
            />
          </>
        )}
      </div>

      {filteredAndSortedShifts.length === 0 ? (
        <EmptyShifts />
      ) : (
        <ShiftGrid
          shifts={filteredAndSortedShifts}
          selectedShifts={isAdmin ? selectedShifts : undefined}
          onSelectShift={isAdmin ? handleSelectShift : undefined}
        />
      )}

      {isAdmin && (
        <BulkPayRateDialog
          open={showBulkPayRateDialog}
          onOpenChange={setShowBulkPayRateDialog}
          selectedShiftIds={selectedShifts}
          onSuccess={handleBulkPayRateSuccess}
        />
      )}
    </div>
  );
};

export default ShiftList;
